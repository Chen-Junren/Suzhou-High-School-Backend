from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Club(models.Model):
    """社团信息模型"""
    # 社团名称
    name = models.CharField(max_length=100, unique=True, verbose_name='社团名称')
    # 社团描述
    description = models.TextField(blank=True, null=True, verbose_name='社团描述')
    # 社团负责人（关联到User模型）
    leader = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='led_clubs', verbose_name='负责人')
    # 社团成员（多对多关系）
    members = models.ManyToManyField(User, related_name='joined_clubs', blank=True, verbose_name='成员')
    # 联系方式
    contact_email = models.EmailField(max_length=254, blank=True, null=True, verbose_name='联系邮箱')
    contact_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='联系电话')
    # 社团类别
    CATEGORY_CHOICES = (
        ('academic', '学术类'),
        ('art', '艺术类'),
        ('sports', '体育类'),
        ('tech', '科技类'),
        ('culture', '文化类'),
        ('volunteer', '志愿类'),
        ('other', '其他'),
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other', verbose_name='社团类别')
    # 社团状态
    STATUS_CHOICES = (
        ('active', '活跃'),
        ('inactive', '非活跃'),
        ('pending', '待审核'),
        ('closed', '已关闭'),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='状态')
    # 创建时间和更新时间
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '社团'
        verbose_name_plural = '社团'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
