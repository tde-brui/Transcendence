from django.http import JsonResponse, HttpResponse
from rest_framework.parsers import JSONParser
from django.contrib.auth.models import User
from .serializers import UserSerializer
from django.views.decorators.csrf import csrf_exempt

# Create your views here.
@csrf_exempt
def user_list(request):
	#list all users
	if 	request.method == 'GET':
		users = User.objects.all()
		serializer = UserSerializer(users, many=True)
		return JsonResponse(serializer.data, safe=False)
	
	elif request.method == 'POST':
		data = JSONParser().parse(request)
		serializer = UserSerializer(data=data)
		if serializer.is_valid():
			serializer.save()
			return JsonResponse(serializer.data, status=201)
		print(serializer.errors)
		return JsonResponse(serializer.errors, status=400)

@csrf_exempt
def user_detail(request, pk):
    """
    Retrieve, update or delete a code snippet.
    """
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
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