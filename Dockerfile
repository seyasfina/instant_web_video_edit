FROM ruby:3.2.2

ENV LANG=C.UTF-8
ENV TZ=Asia/Tokyo

RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get update -qq && apt-get install -y \
    build-essential \
    libpq-dev \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN gem install bundler

COPY package*.json ./
RUN npm install

COPY Gemfile* ./
RUN bundle install
