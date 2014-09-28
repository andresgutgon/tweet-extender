# -*- encoding: utf-8 -*-
require "bundler"
Bundler.setup(:default)
Bundler.require

enable :sessions
set :session_secret, "adasd2aGUGGuweKNFYLgdd32bVyfsdjjYLAR32VGY3197Hgdns"

# binding.pry
TWITTER_CONSUMER_KEY = ENV['TWITTER_CONSUMER_KEY']
TWITTER_CONSUMER_SECRET = ENV['TWITTER_CONSUMER_SECRET']
MESSAGE = ENV['MESSAGE']

puts TWITTER_CONSUMER_KEY
puts MESSAGE

use OmniAuth::Builder do
  provider :twitter, TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET
end

get "/" do
  erb :index
end

get "/auth/twitter/callback" do
  auth = request.env["omniauth.auth"]

  client = Twitter::REST::Client.new do |config|
    config.consumer_key = ENV['TWITTER_CONSUMER_KEY']
    config.consumer_secret = ENV['TWITTER_CONSUMER_SECRET']
    config.access_token = auth.credentials.token
    config.access_token_secret = auth.credentials.secret
  end

  begin
    client.update(MESSAGE)
    redirect "/done"
  rescue Exception => error
    $stderr << "#{error.class} => #{error.message}\n"
    $stderr << error.backtrace.join("\n") << "\n"
    redirect "/fail"
  end
end

get "/auth/failure" do
  redirect "/fail"
end

get "/done" do
  erb :done
end

get "/fail" do
  erb :fail
end
