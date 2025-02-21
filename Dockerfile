FROM ruby:3.2.2

ENV LANG=C.UTF-8
ENV TZ=Asia/Tokyo

RUN apt-get update -qq && apt-get install -y \
  build-essential \
  libpq-dev \
  nodejs \
  yarn \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN gem install bundler

COPY Gemfile Gemfile.lock /app/
RUN bundle install
