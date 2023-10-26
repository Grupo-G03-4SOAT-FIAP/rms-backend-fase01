import { HttpException, HttpStatus } from '@nestjs/common';

export class ClienteNaoLocalizadoErro extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class NomeClienteDuplicadoErro extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT);
  }
}
