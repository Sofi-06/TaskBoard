import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthenticatedRequest = Request & { user: { id: string; name: string; email: string } };

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getSummary(@Req() request: AuthenticatedRequest) {
    const courses = await this.prisma.course.findMany({
      where: { userId: request.user.id, archivedAt: null },
      include: { tasks: { orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }] } },
      orderBy: { createdAt: 'asc' },
    });
    const tasks = courses.flatMap((course) => course.tasks.map((task) => ({ ...task, course: { id: course.id, name: course.name, color: course.color } })));
    const now = new Date();
    const upcomingTasks = tasks.filter((task) => task.dueDate && task.dueDate >= now && task.status !== 'COMPLETED').sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime());

    return {
      user: request.user,
      stats: {
        pending: tasks.filter((task) => task.status === 'PENDING').length,
        inProgress: tasks.filter((task) => task.status === 'IN_PROGRESS').length,
        completed: tasks.filter((task) => task.status === 'COMPLETED').length,
        upcoming: upcomingTasks.length,
        active: tasks.filter((task) => task.status !== 'COMPLETED').length,
      },
      courses: courses.map((course) => ({ id: course.id, name: course.name, description: course.description, color: course.color, taskCount: course.tasks.length, nextTask: course.tasks.find((task) => task.dueDate && task.dueDate >= now && task.status !== 'COMPLETED') ?? null })),
      upcomingTasks: upcomingTasks.slice(0, 6),
    };
  }
}
