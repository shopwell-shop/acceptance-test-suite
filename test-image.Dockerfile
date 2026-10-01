ARG PHP_VERSION=8.4
ARG SHOPWELL_BUILD_SOURCE="branch"

FROM ghcr.io/shopwell-shop/docker-base:${PHP_VERSION}-nginx-otel AS base-image

FROM base-image AS build-toolchain

ARG COMPOSER_VERSION=2.10.2
ARG COMPOSER_SHA256=5ee7125f8a30a34d246cefdc0bc85b8a783b28f2aec968994118512350d28027

USER root
RUN apk add --no-cache bash git nodejs npm unzip \
    && install -d -o www-data -g www-data /src /tmp/.composer /tmp/.npm \
    && curl --fail --location --retry 5 --retry-all-errors \
        "https://getcomposer.org/download/${COMPOSER_VERSION}/composer.phar" \
        --output /usr/local/bin/composer \
    && echo "${COMPOSER_SHA256}  /usr/local/bin/composer" | sha256sum -c - \
    && chmod +x /usr/local/bin/composer

USER www-data
ENV COMPOSER_HOME=/tmp/.composer
ENV NPM_CONFIG_CACHE=/tmp/.npm

FROM build-toolchain AS checkout-tag

ARG SHOPWELL_VERSION

RUN composer create-project --no-interaction --no-audit \
    "shopwell/production:${SHOPWELL_VERSION#v}" /src

FROM build-toolchain AS checkout-branch

ARG SHOPWELL_VERSION
ARG COMPOSER_ROOT_VERSION="6.7.9999999-dev"

ENV COMPOSER_ROOT_VERSION=${COMPOSER_ROOT_VERSION}

RUN composer create-project --no-interaction --no-audit \
    "shopwell/production:dev-${SHOPWELL_VERSION}" /src

FROM build-toolchain AS checkout-local

ARG COMPOSER_ROOT_VERSION="6.7.9999999-dev"

ENV COMPOSER_ROOT_VERSION=${COMPOSER_ROOT_VERSION}

COPY --chown=www-data:www-data . /src

FROM checkout-${SHOPWELL_BUILD_SOURCE} AS prepare
SHELL ["/usr/bin/env", "bash", "-c"]

WORKDIR /src

RUN --mount=type=cache,target=/tmp/.composer,uid=82,gid=82 \
    --mount=type=cache,target=/tmp/.npm,uid=82,gid=82 <<EOF
set -euxo pipefail

composer require --ignore-platform-reqs --no-interaction "shopwell/deployment-helper:*"
composer dump-autoload
EOF

FROM prepare AS build
SHELL ["/usr/bin/env", "bash", "-c"]

WORKDIR /src

RUN --mount=type=cache,target=/tmp/.composer,uid=82,gid=82 \
    --mount=type=cache,target=/tmp/.npm,uid=82,gid=82 <<EOF
set -euxo pipefail

CI=1 SHOPWELL_SKIP_THEME_COMPILE=1 ./bin/build-js.sh
composer dump-autoload --no-interaction --optimize --classmap-authoritative
EOF

FROM base-image AS final

COPY --from=build --chown=82:82 /src /var/www/html
COPY --chown=82:82 <<EOF /var/www/html/install.lock
# Skip installer
EOF

FROM final
