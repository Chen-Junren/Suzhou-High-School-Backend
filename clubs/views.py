from django.contrib.auth import authenticate, login, logout
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework import filters
from .models import Club
from .serializers import UserSerializer, UserRegisterSerializer, LoginSerializer, ClubSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def user_register(request):
    serializer = UserRegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def user_login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        user = authenticate(username=username, password=password)
        if user is not None:
            login(request, user)
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
            })
        else:
            return Response({
                'error': '用户名或密码错误'
            }, status=status.HTTP_401_UNAUTHORIZED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_logout(request):
    # 删除用户的token
    if hasattr(request.user, 'auth_token'):
        request.user.auth_token.delete()
    logout(request)
    return Response({'message': '注销成功'}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    user = request.user
    serializer = UserSerializer(user)
    return Response(serializer.data)


# 社团信息的增删改查视图集
class ClubViewSet(viewsets.ModelViewSet):
    queryset = Club.objects.all()
    serializer_class = ClubSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    # 配置可搜索的字段
    search_fields = ['name', 'description']
    # 配置可排序的字段
    ordering_fields = ['name', 'created_at', 'category', 'status']
    # 默认排序规则
    ordering = ['name']
    def get_queryset(self):
        # 默认返回所有社团
        queryset = Club.objects.all().select_related('leader').prefetch_related('members')
        # 自定义的category 和 status 过滤
        category = self.request.query_params.get('category', None)
        status = self.request.query_params.get('status', None)
        if category:
            queryset = queryset.filter(category__iexact=category)
        if status:
            queryset = queryset.filter(status__iexact=status)
        return queryset
    def perform_create(self, serializer):
        club = serializer.save()
        user = self.request.user
        if not club.leader:
            club.leader = user
        club.members.add(user)
        club.save()
    
    def perform_update(self, serializer):
        # 更新社团信息
        serializer.save()
    
    def destroy(self, request, *args, **kwargs):
        # 删除社团前的检查
        instance = self.get_object()
        # 检查当前用户是否为负责人
        if instance.leader != request.user:
            return Response(
                {'error': '只有社团负责人可以删除社团'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


# 加入社团
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_club(request, club_id):
    try:
        club = Club.objects.get(id=club_id)
        if request.user in club.members.all():
            return Response({'message': '您已经是该社团的成员'}, status=status.HTTP_200_OK)
        
        club.members.add(request.user)
        club.save()
        return Response({'message': '成功加入社团'}, status=status.HTTP_200_OK)
    except Club.DoesNotExist:
        return Response({'error': '社团不存在'}, status=status.HTTP_404_NOT_FOUND)


# 退出社团
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_club(request, club_id):
    try:
        club = Club.objects.get(id=club_id)
        if request.user not in club.members.all():
            return Response({'message': '您不是该社团的成员'}, status=status.HTTP_200_OK)
        
        # 负责人不能退出社团，只能转让或关闭
        if club.leader == request.user:
            return Response(
                {'error': '作为负责人，您不能直接退出社团，请先转让负责人身份'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        club.members.remove(request.user)
        club.save()
        return Response({'message': '成功退出社团'}, status=status.HTTP_200_OK)
    except Club.DoesNotExist:
        return Response({'error': '社团不存在'}, status=status.HTTP_404_NOT_FOUND)
