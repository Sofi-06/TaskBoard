import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prismaService: PrismaService) {}

  async ensureCourseExists(courseId: string) {
    const course = await this.prismaService.course.findFirst({
      where: {
        id: courseId,
        archivedAt: null,
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with id ${courseId} was not found`);
    }

    return course;
  }

  async create(courseId: string, createTaskDto: CreateTaskDto) {
    await this.ensureCourseExists(courseId);

    return this.prismaService.task.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        status: createTaskDto.status ?? 'PENDING',
        priority: createTaskDto.priority ?? 'MEDIUM',
        dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
        course: {
          connect: { id: courseId },
        },
      },
    });
  }

  async findAllByCourse(courseId: string, query: ListTasksQueryDto) {
    await this.ensureCourseExists(courseId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();

    const where = {
      courseId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.task.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.task.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const task = await this.prismaService.task.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with id ${id} was not found`);
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    await this.findOne(id);

    return this.prismaService.task.update({
      where: { id },
      data: {
        ...(updateTaskDto.title !== undefined ? { title: updateTaskDto.title } : {}),
        ...(updateTaskDto.description !== undefined
          ? { description: updateTaskDto.description }
          : {}),
        ...(updateTaskDto.status !== undefined ? { status: updateTaskDto.status } : {}),
        ...(updateTaskDto.priority !== undefined ? { priority: updateTaskDto.priority } : {}),
        ...(updateTaskDto.dueDate !== undefined
          ? { dueDate: updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : null }
          : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prismaService.task.delete({
      where: { id },
    });
  }
}
