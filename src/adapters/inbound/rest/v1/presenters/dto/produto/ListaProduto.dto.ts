export class ListaProdutoDTO {
  constructor(
    readonly id: string,
    readonly nome: string,
    readonly descricao: string,
    readonly valorUnitario: number,
    readonly imagemUrl: string,
    readonly idCategoria: number,
    readonly ativo: boolean,
  ) {}
}
