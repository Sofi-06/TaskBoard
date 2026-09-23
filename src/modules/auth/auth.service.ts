import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { MailService, brandedEmail } from '../../common/mail/mail.service';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  private signToken(userId: string, email: string) {
    return this.jwtService.sign({ sub: userId, email });
  }

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: registerDto.name.trim(),
        email,
        password: passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      user,
      accessToken: this.signToken(user.id, user.email),
    };
  }

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isValidPassword = await bcrypt.compare(loginDto.password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { password, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken: this.signToken(user.id, user.email),
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async forgotPassword(rawEmail: string) {
    const email = rawEmail.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = randomBytes(32).toString('hex');
      await this.prisma.user.update({ where: { id: user.id }, data: { resetTokenHash: createHash('sha256').update(token).digest('hex'), resetTokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
      const url = `${process.env.APP_URL || 'http://localhost:5173'}#reset-password/${token}`;
      await this.mailService.send(user.email, 'Recupera tu contraseña de TaskBoard', brandedEmail(`Hola ${user.name}`, '<p>Recibimos una solicitud para cambiar tu contraseña.</p><p>El enlace es válido durante 30 minutos.</p>', { label: 'Restablecer contraseña', url }));
    }
    return { message: 'Si el correo existe, recibirás un enlace para recuperar tu contraseña.' };
  }

  async resetPassword(token: string, password: string) {
    const hash = createHash('sha256').update(token).digest('hex');
    const user = await this.prisma.user.findFirst({ where: { resetTokenHash: hash, resetTokenExpiresAt: { gt: new Date() } } });
    if (!user) throw new UnauthorizedException('El enlace no es válido o ya venció');
    await this.prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(password, 10), resetTokenHash: null, resetTokenExpiresAt: null } });
    return { message: 'Contraseña actualizada correctamente' };
  }
}
