from django.http import JsonResponse, HttpResponse
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from .models import PongUser
from .serializers import UserSerializer, LoginSerializer
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
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
			user = authenticate(request, username=username, password=password)
			if user:
				refresh = RefreshToken.for_user(user) 
				return Response({
					'user_id': user.id,
					'refresh': str(refresh),
					'access': str(refresh.access_token),
				}, status=status.HTTP_200_OK)
			else:
				return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

		
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