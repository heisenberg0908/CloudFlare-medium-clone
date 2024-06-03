import { Hono } from 'hono'
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign} from 'hono/jwt'
import { signupInput,signinInput } from '@orion1234/common'

export const userRouter=new Hono<{
    Bindings:{
        DATABASE_URL:string,
        JWT_SECRET:string
    }
}>()

userRouter.post('/signup', async(c) => {
    const body=await c.req.json()
    const {success}=signupInput.safeParse(body)
    if(!success){
      c.status(403)
      return c.json({
        msg:'invalid input format'
      })
    }
    const prisma=new PrismaClient({
      datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    try {
      const user=await prisma.user.create({
        data:{
        email:body.email,
        name:body.name,
        password:body.password
      }
    });
    const jwt=await sign({id:user.id},c.env.JWT_SECRET)
    return c.json({jwt})
    
    } catch (error) {

      return c.status(403)
    }
  })
userRouter.post('/signin', async(c) => {
    const body=await c.req.json()
    const {success}=signinInput.safeParse(body)
    if(!success){
      c.status(403)
      return c.json({
        msg:'invalid inputs types'
      })
    }
    const prisma=new PrismaClient({
      datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    try {
      const user=await prisma.user.findUnique({
        where:{
          email:body.email,
          password:body.password
        }
      })
      if(!user){
        c.status(403)
        return c.json({
          msg:'user not found,incorrect credits'
        })
      }
      const jwt=await sign({id:user.id},c.env.JWT_SECRET)
      return c.json({jwt})
    } catch (error) {
      console.error(error)
    }
  })
