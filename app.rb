# -*- encoding: utf-8 -*-
require "bundler"
Bundler.setup(:default)
Bundler.require

require 'dotenv'
Dotenv.load

require 'sinatra'
require 'rack-flash'
require 'omniauth-twitter'

enable :sessions
set :session_secret, ENV['SESSION_SECRET']
set :public_folder, Proc.new { File.join(root, "static") }
set :protection, except: :session_hijacking

use Rack::Flash

TWITTER_CONSUMER_KEY = ENV['TWITTER_CONSUMER_KEY']
TWITTER_CONSUMER_SECRET = ENV['TWITTER_CONSUMER_SECRET']
MESSAGE = ENV['MESSAGE']

helpers do
  def current_user?
    session[:user]
  end
end

use OmniAuth::Builder do
  provider :twitter, TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET
end

get "/" do
  if current_user?
    @name = session[:user][:name]
    @avatar = session[:user][:image]
    erb :index
  else
    erb :login
  end
end

post "/publish" do
  redirect "/login" unless current_user?

  client = Twitter::REST::Client.new do |config|
    config.consumer_key = ENV['TWITTER_CONSUMER_KEY']
    config.consumer_secret = ENV['TWITTER_CONSUMER_SECRET']
    config.access_token = session[:user][:token]
    config.access_token_secret = session[:user][:token_secret]
  end

  # If tweet is with image
  if params[:embeded_image] && params[:embeded_image][:tempfile] && params[:embeded_image][:tempfile].respond_to?(:to_io)
    client.update_with_media(params[:valid_tweet_text], params[:embeded_image][:tempfile])
  else
    client.update(params[:valid_tweet_text])
  end

  flash[:success] = "Tweet enviado!"
end

get "/auth/twitter/callback" do
  auth = request.env["omniauth.auth"]

  session[:user] = {}
  session[:user][:name] = auth.info.name
  session[:user][:image] = auth.info.image
  session[:user][:token] = auth.credentials.token
  session[:user][:token_secret] = auth.credentials.secret

  flash[:success] = "¡Estás dentro!"

  begin
    redirect "/"
  rescue Exception => error
    $stderr << "#{error.class} => #{error.message}\n"
    $stderr << error.backtrace.join("\n") << "\n"
    redirect "/fail"
  end
end


get "/auth/failure" do
  params[:message]
end

get "/login" do
  erb :login
end

get "/logout" do
  session.clear
  redirect "/login"
end

get "/fail" do
  erb :fail
end
