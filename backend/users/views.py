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
@csrf_exempt
def user_list(request):
	#list all users
	# if 	request.method == 'GET':
	# 	users = PongUser.objects.all()
	# 	serializer = UserSerializer(users, many=True)
	# 	return JsonResponse(serializer.data, safe=False)
	
	if request.method == 'POST':
		data = JSONParser().parse(request)
		serializer = UserSerializer(data=data)
		if serializer.is_valid():
			serializer.save()
			return JsonResponse(serializer.data, status=201)
		return JsonResponse(serializer.errors, status=400)

class user_login(APIView):
	#logs a user in
	def post(self, request, *args, **kwargs):
		serializer = LoginSerializer(data=request.data)
		if serializer.is_valid():
			username = serializer.validated_data['username']
			password = serializer.validated_data['password']
			two_factor_enabled = serializer.validated_data['two_factor_enabled']
			email = serializer.validated_data.get('email')
			user = authenticate(request, username=username, password=password, email=email, two_factor_enabled=True)
			if user:
				if user:
					otp = OTP.generate_code(user)
					send_otp_email(user, otp)
					return Response({
						'user_id': user.id,
						'message': "Sent OTP code to email",
						}, status=status.HTTP_202_ACCEPTED)
				
				refresh = RefreshToken.for_user(user) 
				return Response({
					'user_id': user.id,
					'refresh': str(refresh),
					'access': str(refresh.access_token),
				}, status=status.HTTP_200_OK)
			else:
				return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
				return Response({
					'user_id': user.id,
					'refresh': str(refresh),
					'access': str(refresh.access_token),
				}, status=status.HTTP_200_OK)
			else:
				return Response({"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)

		except PongUser.DoesNotExist:
			return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
		
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