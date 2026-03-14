import { NestFactory } from '@nestjs/core'
import helmet from 'helmet'
import * as morgan from 'morgan'
import { AuthModule } from './auth.module'
import { ConfigService } from '@nestjs/config'
import { CustomValidationPipe } from '@app/utils'

async function bootstrap() {
  const app = await NestFactory.create(AuthModule)
  const config = app.get<ConfigService>(ConfigService)

  const PORT = config.getOrThrow('PORT')

  app.use(helmet())
  app.use(morgan('dev'))

  app.setGlobalPrefix('api')
  app.useGlobalPipes(new CustomValidationPipe())

  await app.listen(PORT, () => {
    console.log(`Listening to requests on port: ${PORT}`)
  })
}

bootstrap()
