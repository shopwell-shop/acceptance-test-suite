ARG PHP_VERSION=8.4
ARG SHOPWELL_BUILD_SOURCE="branch"

FROM ghcr.io/shopwell/docker-base:${PHP_VERSION}-nginx-otel AS base-image
FROM ghcr.io/shopwell/shopwell-cli:latest-php-${PHP_VERSION} AS shopwell-cli

FROM shopwell-cli AS checkout-tag

ARG SHOPWELL_VERSION

RUN shopwell-cli project create /src ${SHOPWELL_VERSION#v} --verbose --no-audit

FROM shopwell-cli AS checkout-branch

ARG SHOPWELL_VERSION
ARG COMPOSER_ROOT_VERSION="6.7.9999999-dev"

ENV COMPOSER_ROOT_VERSION=${COMPOSER_ROOT_VERSION}

RUN shopwell-cli project create /src dev-${SHOPWELL_VERSION} --verbose --no-audit

FROM shopwell-cli AS checkout-local

ARG COMPOSER_ROOT_VERSION="6.7.9999999-dev"

ENV COMPOSER_ROOT_VERSION=${COMPOSER_ROOT_VERSION}

COPY . /src

FROM checkout-${SHOPWELL_BUILD_SOURCE} AS prepare
SHELL ["/usr/bin/env", "bash", "-c"]

WORKDIR /src

RUN --mount=type=cache,target=/root/.composer \
    --mount=type=cache,target=/root/.npm <<EOF
set -euxo pipefail

composer require --ignore-platform-reqs --no-interaction "shopwell/deployment-helper:*"
composer dump-autoload
EOF

FROM prepare AS build
SHELL ["/usr/bin/env", "bash", "-c"]

WORKDIR /src

RUN --mount=type=cache,target=/root/.composer \
    --mount=type=cache,target=/root/.npm <<EOF
set -euxo pipefail

shopwell-cli project ci . --with-dev-dependencies
EOF

FROM base-image AS final

COPY --from=build --chown=82:82 /src /var/www/html
COPY --chown=82:82 <<EOF /var/www/html/install.lock
# Skip installer
EOF

ADD --chown=82:82 https://github.com/shopwell-shop/web-recovery/releases/latest/download/shopwell-installer.phar.php /var/www/html/public/shopwell-installer.phar.php

FROM final
