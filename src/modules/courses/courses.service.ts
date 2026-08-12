import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { ListCoursesQueryDto } from './dto/list-courses-query.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createCourseDto: CreateCourseDto) {
    return this.prismaService.course.create({
      data: {
        name: createCourseDto.name,
        description: createCourseDto.description,
        color: createCourseDto.color,
        user: {
          connect: {
            id: createCourseDto.userId,
          },
        },
      },
    });
  }

  async findAll(query: ListCoursesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();

    const where = {
      archivedAt: null,
      ...(query.userId ? { userId: query.userId } : {}),
      ...(search
        ? {
            name: {
              contains: search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.course.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.course.count({ where }),
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
    const course = await this.prismaService.course.findFirst({
      where: {
        id,
        archivedAt: null,
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with id ${id} was not found`);
    }

    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    await this.findOne(id);

    return this.prismaService.course.update({
      where: { id },
      data: {
        ...(updateCourseDto.name !== undefined ? { name: updateCourseDto.name } : {}),
        ...(updateCourseDto.description !== undefined
          ? { description: updateCourseDto.description }
          : {}),
        ...(updateCourseDto.color !== undefined ? { color: updateCourseDto.color } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prismaService.course.update({
      where: { id },
      data: {
        archivedAt: new Date(),
      },
    });
  }
}
