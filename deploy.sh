#!/usr/bin/env bash
# =============================================================
#  Lumo — atualiza o site no VPS a partir do GitHub
#  Uso no servidor:  bash /var/www/lumo-ia.com/deploy.sh
# =============================================================
set -euo pipefail

SITE_DIR="/var/www/lumo-ia.com"

echo "==> Atualizando $SITE_DIR"
cd "$SITE_DIR"

# Os arquivos pertencem ao www-data (para o nginx ler), mas este script roda
# como root. O git bloqueia repositorios de outro dono, entao liberamos o caminho.
if ! git config --global --get-all safe.directory 2>/dev/null | grep -qx "$SITE_DIR"; then
  git config --global --add safe.directory "$SITE_DIR"
  echo "    (repositorio liberado no git: safe.directory)"
fi

# Baixa a versão mais recente do branch main
git fetch --all
git reset --hard origin/main

# Permissões corretas para o nginx servir os arquivos
chown -R www-data:www-data "$SITE_DIR"
find "$SITE_DIR" -type d -exec chmod 755 {} \;
find "$SITE_DIR" -type f -exec chmod 644 {} \;

# Valida a configuração antes de recarregar (evita derrubar o site)
echo "==> Testando configuracao do nginx"
nginx -t

echo "==> Recarregando nginx"
systemctl reload nginx

echo ""
echo "Deploy concluido. Versao no ar:"
git log -1 --format='  %h  %ad  %s' --date=short
