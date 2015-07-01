import ConfigParser
import base64
import binascii
import collections
import hashlib
import hmac
import json
import jwt
import os
import pickle
import random
import requests
import time
import urllib
from datetime import datetime, timedelta
from functools import wraps
from urlparse import parse_qs, parse_qsl
from urllib import urlencode
from flask import Flask, g, send_file, request, redirect, url_for, jsonify
from flask.ext.sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from requests_oauthlib import OAuth1
from jwt import DecodeError, ExpiredSignature
from flask.ext.cors import CORS

# Configuration

current_path = os.path.dirname(__file__)
client_path = os.path.abspath(os.path.join(current_path, '..', '..', 'client'))

app = Flask(__name__, static_url_path='', static_folder=client_path)
# CORS(app, resources=r'/api/*', allow_headers='Content-Type')
CORS(app)
app.config.from_object('config')

db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True)
    password = db.Column(db.String(120))
    display_name = db.Column(db.String(120))
    twitter = db.Column(db.String(120))
    oauth_token = db.Column(db.String(120))
    oauth_token_secret = db.Column(db.String(120))

    def __init__(self, display_name,
                 twitter, oauth_token, oauth_token_secret, email=None, password=None):
        if email:
            self.email = email.lower()
        if password:
            self.set_password(password)
        if display_name:
            self.display_name = display_name
        if twitter:
            self.twitter = twitter
        if oauth_token:
            self.oauth_token = oauth_token
        if oauth_token_secret:
            self.oauth_token_secret = oauth_token_secret

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def to_json(self):
        return dict(id=self.id, email=self.email, displayName=self.display_name,
                    twitter=self.twitter, oauth_token=self.oauth_token, oauth_token_secret=self.oauth_token_secret)


db.create_all()

def escape(s):
    """Percent Encode the passed in string"""
    return urllib.quote(s, safe='~')

def create_token(user):
    payload = {
        'sub': user.id,
        'iat': datetime.now(),
        'exp': datetime.now() + timedelta(days=14)
    }
    token = jwt.encode(payload, app.config['TOKEN_SECRET'])
    return token.decode('unicode_escape')


def parse_token(req):
    token = req.headers.get('Authorization').split()[1]
    return jwt.decode(token, app.config['TOKEN_SECRET'])

def sendTwitterRequest(user, url, url_parameters, is_get_request=True):
    consumer_key = app.config['TWITTER_CONSUMER_KEY']
    consumer_secret = app.config['TWITTER_CONSUMER_SECRET']

    oauth_parameters = get_oauth_parameters(consumer_key, user.oauth_token)

    oauth_parameters['oauth_signature'] = generate_signature(
            "get" if is_get_request else "post", url, url_parameters, oauth_parameters,
            consumer_key, consumer_secret, user.oauth_token_secret,
            None if is_get_request else url_parameters['status']
            )

    headers = { 'Authorization': create_auth_header(oauth_parameters)}

    r = {}

    if (is_get_request):
        url += '?' + urllib.urlencode(url_parameters)
        r = requests.get(url, headers=headers)
    else:
        r = requests.post(url, headers=headers, data=url_parameters)

    return json.dumps(json.loads(r.text), sort_keys=False, indent=4)


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.headers.get('Authorization'):
            response = jsonify(message='Missing authorization header')
            response.status_code = 401
            return response

        try:
            payload = parse_token(request)
        except DecodeError:
            response = jsonify(message='Token is invalid')
            response.status_code = 401
            return response
        except ExpiredSignature:
            response = jsonify(message='Token has expired')
            response.status_code = 401
            return response

        g.user_id = payload['sub']

        return f(*args, **kwargs)

    return decorated_function

def get_oauth_parameters(consumer_key, access_token):
    """Returns  OAuth parameters needed for making request"""

    oauth_parameters = {
        'oauth_timestamp':str(int(time.time())),
        'oauth_signature_method': "HMAC-SHA1",
        'oauth_version': "1.0",
        'oauth_token': access_token,
        'oauth_nonce': get_nonce(),
        'oauth_consumer_key': consumer_key
    }

    return oauth_parameters 

def get_nonce():
    """Unique token generated for each request"""
    n = base64.b64encode(
            ''.join([str(random.randint(0, 9)) for i in range(24)]))
    return n

def collect_parameters(oauth_parameters, status, url_parameters):
    """Combines oauth, url and status parameters"""
    #Add the oauth_parameters to temp hash
    temp = oauth_parameters.copy()

    #Add the status, if passed in.  Used for posting a new tweet
    if status is not None:
        temp['status'] = status

    #Add the url_parameters to the temp hash
    for k, v in url_parameters.iteritems():
        temp[k] = v

    return temp

def generate_signature(method, url, url_parameters, oauth_parameters,
                       oauth_consumer_key, oauth_consumer_secret,
                       oauth_token_secret=None, status=None):
    """Create the signature base string"""

    #Combine parameters into one hash
    temp = collect_parameters(oauth_parameters, status, url_parameters)

    #Create string of combined url and oauth parameters
    parameter_string = stringify_parameters(temp)


    #Create your Signature Base String
    signature_base_string = (
        method.upper() + '&' +
        escape(str(url)) + '&' +
        escape(parameter_string)
    )

    #Get the signing key
    signing_key = create_signing_key(oauth_consumer_secret, oauth_token_secret)

    return calculate_signature(signing_key, signature_base_string)

def stringify_parameters(parameters):
    """Orders parameters, and generates string representation of parameters"""
    output = ''
    ordered_parameters = {}
    ordered_parameters = collections.OrderedDict(sorted(parameters.items()))

    counter = 1
    for k, v in ordered_parameters.iteritems():
        output += escape(str(k)) + '=' + escape(str(v))
        if counter < len(ordered_parameters):
            output += '&'
            counter += 1

    return output

def create_signing_key(oauth_consumer_secret, oauth_token_secret=None):
    """Create key to sign request with"""
    signing_key = escape(oauth_consumer_secret) + '&'

    if oauth_token_secret is not None:
        signing_key += escape(oauth_token_secret)

    return signing_key

def calculate_signature(signing_key, signature_base_string):
    """Calculate the signature using SHA1"""
    hashed = hmac.new(signing_key, signature_base_string, hashlib.sha1)

    sig = binascii.b2a_base64(hashed.digest())[:-1]

    return escape(sig)

def create_auth_header(parameters):
    """For all collected parameters, order them and create auth header"""
    ordered_parameters = {}
    ordered_parameters = collections.OrderedDict(sorted(parameters.items()))
    auth_header = (
        '%s="%s"' % (k, v) for k, v in ordered_parameters.iteritems())
    val = "OAuth " + ', '.join(auth_header)
    return val

# Routes

@app.route('/')
def index():
    return send_file('../../client/index.html')


@app.route('/api/me')
@login_required
def me():
    user = User.query.filter_by(id=g.user_id).first()
    return jsonify(user.to_json())


@app.route('/auth/login', methods=['POST'])
def login():
    user = User.query.filter_by(email=request.json['email']).first()
    if not user or not user.check_password(request.json['password']):
        response = jsonify(message='Wrong Email or Password')
        response.status_code = 401
        return response
    token = create_token(user)
    return jsonify(token=token)


@app.route('/auth/signup', methods=['POST'])
def signup():
    user = User(email=request.json['email'], password=request.json['password'])
    db.session.add(user)
    db.session.commit()
    token = create_token(user)
    return jsonify(token=token)

@app.route('/auth/twitter', methods=['GET', 'POST'])
def twitter():
    request_token_url = 'https://api.twitter.com/oauth/request_token'
    access_token_url = 'https://api.twitter.com/oauth/access_token'
    authenticate_url = 'https://api.twitter.com/oauth/authenticate'

    if request.args.get('oauth_token') and request.args.get('oauth_verifier'):
        auth = OAuth1(app.config['TWITTER_CONSUMER_KEY'],
                      client_secret=app.config['TWITTER_CONSUMER_SECRET'],
                      resource_owner_key=request.args.get('oauth_token'),
                      verifier=request.args.get('oauth_verifier'))
        r = requests.post(access_token_url, auth=auth)
        profile = dict(parse_qsl(r.text))

        user = User.query.filter_by(twitter=profile['user_id']).first()
        if user:
            token = create_token(user)
            return jsonify(token=token)

        u = User(twitter=profile['user_id'],
                 display_name=profile['screen_name'],
                 oauth_token=profile['oauth_token'],
                 oauth_token_secret=profile['oauth_token_secret'])
        db.session.add(u)
        db.session.commit()
        token = create_token(u)
        return jsonify(token=token)
    else:
        oauth = OAuth1(app.config['TWITTER_CONSUMER_KEY'],
                       client_secret=app.config['TWITTER_CONSUMER_SECRET'],
                       callback_uri=app.config['TWITTER_CALLBACK_URL'])
        r = requests.post(request_token_url, auth=oauth)
        oauth_token = dict(parse_qsl(r.text))
        qs = urlencode(dict(oauth_token=oauth_token['oauth_token']))
        return redirect(authenticate_url + '?' + qs)

@app.route('/api/twitter/account/verify_credentials', methods=['GET'])
@login_required
def verify_credentials():
    url = 'https://api.twitter.com/1.1/account/verify_credentials.json'
    url_parameters = {}
    user = User.query.filter_by(id=g.user_id).first()

    return sendTwitterRequest(user, url, url_parameters)

@app.route('/api/twitter/statuses/user_timeline', methods=['GET'])
@login_required
def user_timeline():
    url = 'https://api.twitter.com/1.1/statuses/user_timeline.json'
    url_parameters = { "count": "3" }
    user = User.query.filter_by(id=g.user_id).first()

    return sendTwitterRequest(user, url, url_parameters)

@app.route('/api/twitter/statuses/update', methods=['POST'])
@login_required
def update():
    url = 'https://api.twitter.com/1.1/statuses/update.json'
    url_parameters = { "status": request.json['status'] }

    user = User.query.filter_by(id=g.user_id).first()
    return sendTwitterRequest(user, url, url_parameters, False)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
