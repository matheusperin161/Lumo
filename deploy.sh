#!/usr/bin/env bash
# =============================================================
#  Lumo — atualiza o site no VPS a partir do GitHub
#  Uso no servidor:  bash /var/www/lumo-ia.com/deploy.sh
# =============================================================
set -euo pipefail

SITE_DIR="/var/www/lumo-ia.com"

echo "==> Atualizando $SITE_DIR"
cd "$SITE_DIR"

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
