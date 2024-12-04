from django.http import Http404
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from .models import PongUser, OTP
from .serializers import UserSerializer, LoginSerializer
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework.views import APIView
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status, viewsets, generics
from django.shortcuts import get_object_or_404
from rest_framework import status
from django.http import HttpResponseRedirect
from rest_framework.renderers import JSONRenderer
from django.db import IntegrityError
import requests

class get_users(APIView):
	def get(self, request, *args, **kwargs):
		users = PongUser.objects.all()
		serializer = UserSerializer(users, many=True)
		return Response(serializer.data, status=status.HTTP_200_OK)

class user_register(APIView):
	def post(self, request, *args, **kwargs):
		serializer = UserSerializer(data=request.data)
		if serializer.is_valid():
			serializer.save()
			user = authenticate_user(request, serializer)
			return return_JWT(user)

class user_login(APIView):
	#logs a user in
	def post(self, request, *args, **kwargs):
		serializer = LoginSerializer(data=request.data)
		if serializer.is_valid():
			user = authenticate_user(request, serializer)
			return return_JWT(user)

def user_42_login(request):
	authorization_url = f"{settings.AUTHORIZATION_URL}?client_id={settings.CLIENT_ID}&redirect_uri={settings.REDIRECT_URI}&response_type=code"
	return HttpResponseRedirect(authorization_url)

def user_42_callback(request):
	# Get the authorization code from the query string
	authorization_code = request.GET.get('code')

	if not authorization_code:
		return HttpResponseRedirect({f"{settings.FRONTEND_URL}/42-callback?error=authorization code not found"}, status=400)

	# Exchange the authorization code for an access token from the 42 API
	try:
		token_response = requests.post(settings.TOKEN_URL, data={
			'grant_type': 'authorization_code',
			'client_id': settings.CLIENT_ID,
			'client_secret': settings.CLIENT_SECRET,
			'code': authorization_code,
			'redirect_uri': settings.REDIRECT_URI,
		})
		token_response.raise_for_status()
		access_token = token_response.json().get('access_token')
		user_response = requests.get(settings.USER_URL, headers={
			'Authorization': f"Bearer {access_token}",
		})
		user_response.raise_for_status()
		user_data = user_response.json()

		try:
			user, created = PongUser.objects.get_or_create(
				oauth_id=user_data['id'],
				defaults={
					'username': user_data['login'],
					'email': user_data['email'],
					'firstName': user_data['first_name'],
					'twoFactorEnabled': False,
				})
		except IntegrityError:
			return HttpResponseRedirect(f"{settings.FRONTEND_URL}/42-callback?error=42_user_exists")
		if user.twoFactorEnabled:
			otp = OTP.generate_code(user)
			send_otp_email(user, otp)
			return HttpResponseRedirect(f"{settings.FRONTEND_URL}/42-callback?message=Sent OTP code to email&status_code=202")
		
		refresh = RefreshToken.for_user(user)
		response = HttpResponseRedirect(f"{settings.FRONTEND_URL}/42-callback?user_id={user.id}&status_code=200")
		response.set_cookie(
			'access_token',
			str(refresh.access_token),
			max_age=3600, # 1 hour
			httponly=True,
			# secure=True,  # HTTPS only, doesnt work when testing locally
			samesite='Lax',
		)
		return response	
	except requests.exceptions.RequestException as e:
		return HttpResponseRedirect(f"{settings.FRONTEND_URL}/42-callback?error=42_login_failed")
	

def authenticate_user(request, serializer):
	username = serializer.validated_data['username']
	password = serializer.validated_data['password']
	user = authenticate(request, username=username, password=password)
	return user

def return_JWT(user):
	if user:
		if user.twoFactorEnabled:
			otp = OTP.generate_code(user)
			send_otp_email(user, otp)
			return Response({
				'user_id': user.id,
				'message': "Sent OTP code to email",
				}, status=status.HTTP_202_ACCEPTED)
		refresh = RefreshToken.for_user(user)

		response = Response({
			'user_id': user.id,
			'message': "Logged in successfully",
		}, status=status.HTTP_200_OK)

		response.set_cookie(
			'access_token',
			str(refresh.access_token),
			max_age=3600, # 1 hour
			httponly=True,
			# secure=True,  # HTTPS only, doesnt work when testing locally
			samesite='Lax',
		)
		# response.set_cookie(
		# 	'user_id',
		# 	str(user.id),
		# 	max_age=3600, # 1 hour
		# 	httponly=False,
		# 	# secure=True, # HTTPS only, doesnt work when testing locally
		# 	samesite='Lax'
		# )
		return response
	else:
		return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

def send_otp_email(user, otp):
	subject = "Your OTP code"
	message = f"Your One-Time-Password code is {otp.code}"
	recipients = [user.email]
	send_mail(subject, message, settings.EMAIL_HOST_USER, recipients)

class verify_otp(APIView):
	def post(self, request, *args, **kwargs):
		user_id = request.data.get('user_id')
		otp_code = request.data.get('otp_code')

		try:
			user = PongUser.objects.get(id=user_id)
			otp = OTP.objects.filter(user=user, code=otp_code).last()
		
			if otp and not otp.is_expired():
				refresh = RefreshToken.for_user(user)
				otp.delete()

				response = Response({
					'user_id': user.id,
					'message': "Logged in successfully",
				}, status=status.HTTP_200_OK)

				response.set_cookie(
					'access_token',
					str(refresh.access_token),
					max_age=3600, # 1 hour
					httponly=True,
					# secure=True, # HTTPS only, doesnt work when testing locally
					samesite='Lax'
				)
				return response
			else:
				return Response({"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)

		except PongUser.DoesNotExist:
			return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class check_token(APIView):
	def get(self, request, *args, **kwargs):
	#check for token in request cookies
		access_token = request.COOKIES.get('access_token')
		if not access_token:
			return Response({"error": "No token provided"}, status=status.HTTP_401_UNAUTHORIZED)
		try:
			AccessToken(access_token)
		except Exception as e:
				return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
		return Response({"message": "Valid token"}, status=status.HTTP_200_OK)

class get_logged_in_user(APIView):
	def get(self, request):
		token = request.COOKIES.get('access_token')
		if not token:
			return Response({"error": "No access token provided"}, status=status.HTTP_401_UNAUTHORIZED)
		try:
			decoded_token = AccessToken(token)
			user_id = decoded_token['user_id']
			# You can fetch more user data from the database if needed
			return Response({"user_id": user_id})
		except Exception as e:
			return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

class user_detail(APIView):
	def get(self, request, pk, *args, **kwargs):
		user = get_object_or_404(PongUser, pk=pk)
		serializer = UserSerializer(user)
		return Response(serializer.data, status=status.HTTP_200_OK)
	def patch(self, request, pk, *args, **kwargs):
		user = get_object_or_404(PongUser, pk=pk)
		serializer = UserSerializer(user, data=request.data, partial=True)  # Partial update
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data, status=status.HTTP_200_OK)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)