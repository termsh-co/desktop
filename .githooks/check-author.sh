#!/bin/sh
# Commit yazar kimliği — yasaklı eski hesap/isimler reddedilir.
set -e

AUTHOR_NAME="${GIT_AUTHOR_NAME:-$(git config user.name)}"
AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-$(git config user.email)}"

BLOCKED_NAMES="e2r-fr-app e2r fr-app"
for bad in $BLOCKED_NAMES; do
  if [ "$AUTHOR_NAME" = "$bad" ]; then
    echo "git hook: yasaklı commit yazarı '$AUTHOR_NAME' — git config user.name düzeltin." >&2
    echo "  Beklenen: Ahmed Furkan Koc <139684794+ahmedfurkankoc@users.noreply.github.com>" >&2
    exit 1
  fi
done

case "$AUTHOR_EMAIL" in
  *e2r*|*fr-app*)
    echo "git hook: yasaklı commit e-postası '$AUTHOR_EMAIL'." >&2
    exit 1
    ;;
esac
