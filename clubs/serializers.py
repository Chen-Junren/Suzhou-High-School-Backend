from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Club

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "两次输入的密码不一致"})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

class ClubSerializer(serializers.ModelSerializer):
    # 将负责人ID转换为负责人详情
    leader = UserSerializer(read_only=True)
    # 将成员ID列表转换为成员详情列表
    members = UserSerializer(many=True, read_only=True)
    # 用于创建和更新时传入负责人ID
    leader_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        source='leader', 
        write_only=True, 
        allow_null=True
    )
    # 用于创建和更新时传入成员ID列表
    member_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        many=True, 
        write_only=True, 
        source='members',
        required=False
    )
    
    class Meta:
        model = Club
        fields = [
            'id', 'name', 'description', 'leader', 'leader_id', 
            'members', 'member_ids', 'contact_email', 'contact_phone',
            'category', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ('created_at', 'updated_at')
    
    def create(self, validated_data):
        # 处理成员数据，因为many-to-many关系需要在实例创建后设置
        members = validated_data.pop('members', [])
        club = Club.objects.create(**validated_data)
        # 添加成员
        for member in members:
            club.members.add(member)
        return club
    
    def update(self, instance, validated_data):
        # 处理成员数据
        if 'members' in validated_data:
            members = validated_data.pop('members')
            instance.members.set(members)
        # 更新其他字段
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance