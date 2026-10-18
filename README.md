# Minhas Viagens

App web para motorista autônomo anotar viagens, confirmar conclusão e recebimento, ver o calendário do mês e gerar o relatório mensal em PDF.

**App no ar:** https://launchpad-asset-garden.lovable.app

## O que o app faz

- **Início** – resumo do mês (dias trabalhados, total recebido) e destaque para as viagens que ainda aguardam confirmação.
- **Nova viagem** – data, valor, descrição e, se for o caso, o valor de adiantamento já recebido.
- **Confirmação** – se a viagem foi concluída e se o pagamento entrou. "Viagem Cheia" (sem desconto) ou "Viagem C/ Desconto" (informa o valor descontado).
- **Calendário** – dias trabalhados, em aberto e sem viagem, com ações de marcar como recebido, editar ou excluir.
- **Relatório** – resumo do mês e geração de PDF (abre em nova janela; escolha "Salvar como PDF").
- **Ajustes** – tema claro, escuro ou automático.

Nos registros aparece **Recebido**, **Pendente** ou **Valor recebido**, com data, hora e período de início e fim da viagem.

## Rodar no computador

Você precisa do Node.js instalado.

```sh
git clone https://github.com/JrNascimentoh-source/app-minhas-viagens.git
cd app-minhas-viagens
npm install
npm run dev
```

O arquivo `.env` que vem no repositório já aponta para o banco do app, então ele funciona sem configuração extra.

**Atenção:** rodando assim, o app usa o mesmo banco do app publicado — as viagens que você anotar aí aparecem no app do celular.

## Sincronização

Este repositório está ligado ao projeto no Lovable. Tudo que é alterado no Lovable é enviado para cá, e o que você enviar para cá volta para o Lovable.

## Tecnologias

- TanStack Start (React)
- TypeScript
- Tailwind CSS
- Lovable Cloud (banco de dados e login)
