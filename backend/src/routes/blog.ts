import { Hono } from "hono"
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { verify } from 'hono/jwt'
import { createPostInput, updatePostInput } from "@orion1234/common"

export const blogRouter=new Hono<{
    Bindings:{
        DATABASE_URL:string,
        JWT_SECRET:string
    },
    Variables:{
        userId:string
    }
}>()

blogRouter.use('/*',async(c,next)=>{
    const authHeader=c.req.header("Authorization") || "";
    try {
        const user=await verify(authHeader,c.env.JWT_SECRET)
        if(user){
            //@ts-ignore
            c.set('userId',user.id);
            await next()
        }
        else{
            c.status(403);
            return c.json({
                message: "You are not logged in"
            })
        }
    } catch (error) {
        c.status(403);
        return c.json({
            message: "You are not logged in"
        })
    }
})

blogRouter.post('/', async(c) => {
    const body=await c.req.json()
    const {success}=createPostInput.safeParse(body)
    if(!success){
        c.status(403)
        return c.json({
            msg:'invalid input type'
        })
    }
    const userId=c.get('userId')
    const prisma=new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    const post=await prisma.post.create({
        data:{
            title:body.title,
            content:body.content,
            authorId:userId
        }
    })
    return c.json({
        id:post.id
    })
})
blogRouter.get('/:id', async(c) => {
    const id=c.req.param("id")
    const prisma=new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    const blog=await prisma.post.findFirst({
        where:{
            //@ts-ignore
            id:Number(id)
        },
        select: {
                id: true,
                title: true,
                content: true,
                author: {
                    select: {
                        name: true
                    }
                }
            }
    })

    return c.json({blog})
})
blogRouter.put('/', async(c) => {
    const body=await c.req.json()
    const {success}=updatePostInput.safeParse(body)
    if(!success){
        c.status(403)
        return c.json({
            msg:'invalid inputs type'
        })
    }
    const prisma=new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blog=await prisma.post.update({
        where:{
            id:body.id
        },
        data:{
            title:body.title,
            content:body.content
        }
    })
    c.status(200)
    return c.json({
        msg:"blog updated",blog
    })
})
blogRouter.get('/all', async(c) => {
    const prisma=new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    const posts=await prisma.post.findMany({})
    return c.json({
        posts:posts
    })
})

