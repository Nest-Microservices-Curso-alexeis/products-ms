/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpStatus, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('ProductsService')
  onModuleInit() {
    this.$connect();
    this.logger.log(`base de datos conectada`)
  }
  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto
    })
    
  }

  async findAll(paginationDto: PaginationDto) {
    const {page, limit} = paginationDto;
    //paginación
    const totalPage = await this.product.count({where: { available: true}})
    const lastPage = Math.ceil(totalPage/limit);
    return {
      data: await this.product.findMany({
        where: {
          available: true
        },
        skip: (page-1)*limit,
        take: limit
      }),
      metadata: {
        total: totalPage,
        page: page,
        lastPage: lastPage,
      }
    }
  }

  async findOne(id: number) {
    const product = await this.product.findFirst({
      where: {
        id: id, available: true
      }
    })
    if(!product) {
      //throw new NotFoundException(`El producto con el id #${id} no existe.`)
      throw new RpcException({
        message:`El producto con el id #${id} no existe.`,
        status: HttpStatus.BAD_REQUEST
      })
    }
    return product
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const {id: __, ...data} = updateProductDto;
    await this.findOne(id);
    return this.product.update({
      where: {id},
      data: data
    })
  }

  async remove(id: number) {
    await this.findOne(id);
    // return this.product.delete({
    //   where: {id}
    // })
    const product = await this.product.update({
      where: {id},
      data: {
        available: false
      }
    })
    return product;
  }
}
