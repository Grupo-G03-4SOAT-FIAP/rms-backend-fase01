import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PedidoModel } from '../../models/pedido.model';
import { ItemPedidoModel } from '../../models/item_pedido.model';
import { IPedidoRepository } from 'src/domain/pedido/interfaces/pedido.repository.port';
import { PedidoEntity } from 'src/domain/pedido/entities/pedido.entity';
import { StatusPedido } from 'src/domain/pedido/enums/pedido.enum';
import { RepositoryDTO } from '../repository.dto';

@Injectable()
export class PedidoRepository implements IPedidoRepository {
  readonly relations = [
    'cliente',
    'itensPedido',
    'itensPedido.produto',
    'itensPedido.produto.categoria',
  ];

  constructor(
    private readonly repositoryDTO: RepositoryDTO,
    @InjectRepository(PedidoModel)
    private readonly pedidoRepository: Repository<PedidoModel>,
    @InjectRepository(ItemPedidoModel)
    private readonly itemPedidoRepository: Repository<ItemPedidoModel>,
  ) {}

  async criarItemPedido(pedidoModel: PedidoModel): Promise<ItemPedidoModel[]> {
    const itensPedido = pedidoModel.itensPedido.map((itemPedido) => {
      const itemPedidoModel = this.itemPedidoRepository.create({
        pedido: { id: pedidoModel.id },
        produto: { id: itemPedido.produto.id },
        quantidade: itemPedido.quantidade,
      });
      return itemPedidoModel;
    });
    await this.itemPedidoRepository.save(itensPedido);
    return itensPedido;
  }

  async criarPedido(pedido: PedidoEntity): Promise<PedidoEntity> {
    const pedidoModel = this.pedidoRepository.create(pedido);
    await this.pedidoRepository.save(pedidoModel);
    await this.criarItemPedido(pedidoModel);
    const pedidoComItemModel = await this.pedidoRepository.findOne({
      where: { id: pedidoModel.id },
      relations: this.relations,
    });
    return this.repositoryDTO.criarPedidoDTO(pedidoComItemModel);
  }

  async editarStatusPedido(
    pedidoId: string,
    statusPedido: string,
  ): Promise<PedidoEntity> {
    await this.pedidoRepository.update(pedidoId, {
      statusPedido: statusPedido,
    });

    const pedidoModelAtualizado = await this.pedidoRepository.findOne({
      where: { id: pedidoId },
      relations: this.relations,
    });
    if (pedidoModelAtualizado) {
      return this.repositoryDTO.criarPedidoDTO(pedidoModelAtualizado);
    }
    return null;
  }

  async editarStatusPagamento(
    pedidoId: string,
    statusPagamento: boolean,
  ): Promise<PedidoEntity> {
    await this.pedidoRepository.update(pedidoId, {
      pago: statusPagamento,
    });

    const pedidoModelAtualizado = await this.pedidoRepository.findOne({
      where: { id: pedidoId },
      relations: this.relations,
    });
    if (pedidoModelAtualizado) {
      return this.repositoryDTO.criarPedidoDTO(pedidoModelAtualizado);
    }
    return null;
  }

  async buscarPedido(pedidoId: string): Promise<PedidoEntity | null> {
    const pedidoModel = await this.pedidoRepository.findOne({
      where: { id: pedidoId },
      relations: this.relations,
    });

    if (pedidoModel) {
      return this.repositoryDTO.criarPedidoDTO(pedidoModel);
    }
    return null;
  }

  async listarPedidos(): Promise<PedidoEntity[] | []> {
    const statusPedidoOrder = {
      pronto: 1,
      em_preparacao: 2,
      recebido: 3,
    };

    const pedidos = await this.pedidoRepository.find({
      where: {
        statusPedido: In([
          StatusPedido.PRONTO,
          StatusPedido.EM_PREPARACAO,
          StatusPedido.RECEBIDO,
        ]),
      },
      order: {
        statusPedido: 'ASC', // Ordenação alfabética para garantir consistência
        criadoEm: 'ASC', // Ordene por criadoEm em ordem crescente (do mais antigo ao mais recente)
      },
      relations: this.relations,
    });

    if (pedidos.length > 0) {
      pedidos.sort(
        (a, b) =>
          statusPedidoOrder[a.statusPedido] - statusPedidoOrder[b.statusPedido],
      );
    }

    const produtoEntityList = pedidos.map((pedido: PedidoModel) => {
      return this.repositoryDTO.criarPedidoDTO(pedido);
    });

    return produtoEntityList;
  }

  async listarPedidosRecebido(): Promise<PedidoEntity[] | []> {
    const pedidos = await this.pedidoRepository.find({
      where: {
        statusPedido: StatusPedido.RECEBIDO,
      },
      order: {
        criadoEm: 'ASC', // Ordene por criadoEm em ordem crescente (do mais antigo ao mais recente)
      },
      relations: this.relations,
    });

    const produtoEntityList = pedidos.map((pedido: PedidoModel) => {
      return this.repositoryDTO.criarPedidoDTO(pedido);
    });

    return produtoEntityList;
  }
}
