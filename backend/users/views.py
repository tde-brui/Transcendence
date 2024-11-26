from django.http import JsonResponse, HttpResponse
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from .models import PongUser, OTP
from .serializers import UserSerializer, LoginSerializer
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status

# Create your views here.
# @csrf_exempt
# def user_list(request):
# 	list all users
# 	if 	request.method == 'GET':
# 		users = PongUser.objects.all()
# 		serializer = UserSerializer(users, many=True)
# 		return JsonResponse(serializer.data, safe=False)
	
# 	if request.method == 'POST':
# 		data = JSONParser().parse(request)
# 		serializer = UserSerializer(data=data)
# 		if serializer.is_valid():
# 			serializer.save()
# 			return JsonResponse(serializer.data, status=201)
# 		return JsonResponse(serializer.errors, status=400)

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

def authenticate_user(request, serializer):
	username = serializer.validated_data['username']
	password = serializer.validated_data['password']
	user = authenticate(request, username=username, password=password)
	return user

def return_JWT(user):
	if user:
		if user.two_factor_enabled:
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
			RefreshToken(access_token)
		except:
			return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
		return Response({"message": "Valid token"}, status=status.HTTP_200_OK)

@csrf_exempt
def user_detail(request, pk):
	"""
	Retrieve, update or delete a code snippet.
	"""
	try:
		user = PongUser.objects.get(pk=pk)
	except PongUser.DoesNotExist:
		return HttpResponse(status=404)

	if request.method == 'GET':
		serializer = UserSerializer(user)
		return JsonResponse(serializer.data)

	elif request.method == 'PUT':
		data = JSONParser().parse(request)
		serializer = UserSerializer(user, data=data)
		if serializer.is_valid():
			serializer.save()
			return JsonResponse(serializer.data)
		return JsonResponse(serializer.errors, status=400)

	elif request.method == 'DELETE':
		user.delete()
		return HttpResponse(status=204)