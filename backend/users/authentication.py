from rest_framework_simplejwt.authentication import JWTAuthentication

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        jwt_token = request.COOKIES.get('access_token')  # Get the token from the cookie
        if jwt_token:
            return self.get_user_and_token(jwt_token)
        return None

    def get_user_and_token(self, raw_token):
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token