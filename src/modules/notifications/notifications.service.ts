import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MailService, brandedEmail } from '../../common/mail/mail.service';

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService, private readonly mail: MailService) {}
  onModuleInit() { void this.checkDueTasks(); setInterval(() => void this.checkDueTasks(), 10 * 60 * 1000); }

  private async checkDueTasks() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return;
    const now = new Date(); const inOneHour = new Date(now.getTime() + 60 * 60 * 1000); const inOneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tasks = await this.prisma.task.findMany({ where: { status: { not: 'COMPLETED' }, dueDate: { gt: now, lte: inOneDay } }, include: { course: { include: { user: true } } } });
    for (const task of tasks) {
      const due = task.dueDate!.getTime(); const user = task.course.user; const hours = (due - now.getTime()) / 3600000;
      if (hours <= 1 && !task.reminder1SentAt) { await this.mail.send(user.email, `Recordatorio: ${task.title}`, brandedEmail('Tu tarea vence pronto ⏰', `<p>La tarea <strong>${task.title}</strong> vence en menos de una hora.</p><p>Curso: <strong>${task.course.name}</strong></p>`)); await this.prisma.task.update({ where: { id: task.id }, data: { reminder1SentAt: now } }); }
      else if (hours <= 24 && !task.reminder24SentAt) { await this.mail.send(user.email, `Recordatorio: ${task.title}`, brandedEmail('Tienes una entrega próxima 📚', `<p>La tarea <strong>${task.title}</strong> vence aproximadamente en <strong>${Math.ceil(hours)} horas</strong>.</p><p>Curso: <strong>${task.course.name}</strong></p>`)); await this.prisma.task.update({ where: { id: task.id }, data: { reminder24SentAt: now } }); }
    }
  }
}
