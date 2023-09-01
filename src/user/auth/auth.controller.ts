import {
  Controller,
  Post,
  Body,
  Param,
  ParseEnumPipe,
  Get,
  UnauthorizedException,
  NotAcceptableException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GenerateProductKeyDto, SigninDto, SignupDto } from '../dtos/auth.dto';
import { UserType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { User, UserInfo } from '../decorators/user.decorator';
import {
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiResponse,
  ApiNotAcceptableResponse,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup/:userType')
  @ApiUnauthorizedResponse({ description: 'Invalid product key' })
  @ApiParam({ name: 'userType', enum: UserType })
  async signup(
    @Body() body: SignupDto,
    @Param('userType', new ParseEnumPipe(UserType))
    userType: UserType,
  ) {
    if (userType !== UserType.BUYER) {
      if (!body.productKey) {
        throw new UnauthorizedException();
      }

      const validProductKey = `${body.email}-${userType}-${process.env.PRODUCT_KEY_SECRET}`;
      const isValidProductKey = await bcrypt.compare(
        validProductKey,
        body.productKey,
      );

      if (!isValidProductKey) {
        throw new UnauthorizedException();
      }
    }
    return this.authService.signup(body, userType);
  }

  @Post('/signin')
  @ApiResponse({
    status: 201,
    description: 'User signed in successfully',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid credentials',
  })
  signin(@Body() body: SigninDto) {
    return this.authService.signin(body);
  }

  @Post('/key')
  @ApiResponse({
    status: 200,
    description: 'Generate product key success',
    schema: {
      type: 'object',
      properties: {
        productKey: { type: 'string' },
      },
    },
  })
  genereteProductKey(@Body() { email, userType }: GenerateProductKeyDto) {
    return this.authService.generateProductKey(email, userType);
  }

  @Get('/me')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        id: { type: 'number' },
        iat: { type: 'number' },
        exp: { type: 'number' },
      },
    },
  })
  @ApiNotAcceptableResponse({ description: 'Token not provided' })
  me(@User() user: UserInfo) {
    if (!user) throw new NotAcceptableException();
    return user;
  }
}
