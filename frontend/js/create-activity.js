// 创建活动页面脚本

// 全局变量
let clubId = null;

$(document).ready(function() {
    // 初始化导航栏状态
    updateNavbar();
    
    // 检查用户登录状态
    if (!isLoggedIn()) {
        window.location.href = `login.html?next=create-activity.html?id=${getURLParameter('id')}`;
        return;
    }
    
    // 获取URL中的社团ID
    clubId = getURLParameter('id');
    
    if (!clubId) {
        showMessage('社团ID不存在，请先选择社团', 'error');
        // 3秒后返回社团列表页面
        setTimeout(function() {
            window.location.href = 'clubs.html';
        }, 3000);
        return;
    }
    
    // 检查用户是否是该社团的领导者
    checkClubLeadership();
    
    // 设置日期最小值为今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('activity-date').min = today;
    
    // 图片预览功能
    $('#activity-image').on('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                $('#image-preview').attr('src', e.target.result);
                $('#image-preview-container').show();
            }
            
            reader.readAsDataURL(file);
        } else {
            $('#image-preview-container').hide();
        }
    });
    
    // 表单提交处理
    $('#create-activity-form').on('submit', function(event) {
        event.preventDefault();
        
        if (validateForm()) {
            submitActivity();
        }
    });
});

// 检查用户是否是社团领导者
function checkClubLeadership() {
    // 显示加载状态
    showMessage('正在验证您的权限...', 'info');
    
    apiRequest(`/clubs/${clubId}/`, 'GET', null, false)
        .then(function(club) {
            const user = getUser();
            
            // 检查用户是否是领导者
            if (user.id !== club.leader.id) {
                $('#create-activity-form').hide();
                showMessage('只有社团负责人可以创建活动', 'error');
                
                // 添加返回按钮
                $('#activity-message').append(`
                    <div class="mt-3">
                        <a href="club-detail.html?id=${clubId}" class="btn btn-primary">
                            <i class="fa fa-arrow-left mr-2"></i>返回社团详情
                        </a>
                    </div>
                `);
                
                return;
            }
            
            // 权限验证通过，隐藏消息
            $('#activity-message').hide();
        })
        .catch(function(error) {
            console.error('验证社团权限失败:', error);
            showMessage('验证社团权限失败，请重新登录后重试', 'error');
            
            // 3秒后返回登录页面
            setTimeout(function() {
                window.location.href = `login.html?next=create-activity.html?id=${clubId}`;
            }, 3000);
        });
}

// 表单验证
function validateForm() {
    let isValid = true;
    const errorMessages = [];
    
    // 验证活动标题
    const title = $('#activity-title').val().trim();
    if (!title) {
        errorMessages.push('请输入活动标题');
        isValid = false;
    } else if (title.length > 100) {
        errorMessages.push('活动标题不能超过100个字符');
        isValid = false;
    }
    
    // 验证活动日期
    const date = $('#activity-date').val();
    const time = $('#activity-time').val();
    
    if (!date || !time) {
        errorMessages.push('请设置活动日期和时间');
        isValid = false;
    } else {
        const activityDateTime = new Date(`${date}T${time}`);
        const now = new Date();
        
        if (activityDateTime <= now) {
            errorMessages.push('活动时间必须晚于当前时间');
            isValid = false;
        }
    }
    
    // 验证活动地点
    const location = $('#activity-location').val().trim();
    if (!location) {
        errorMessages.push('请输入活动地点');
        isValid = false;
    } else if (location.length > 200) {
        errorMessages.push('活动地点描述不能超过200个字符');
        isValid = false;
    }
    
    // 验证活动描述
    const description = $('#activity-description').val().trim();
    if (!description) {
        errorMessages.push('请输入活动描述');
        isValid = false;
    } else if (description.length < 10) {
        errorMessages.push('活动描述至少需要10个字符');
        isValid = false;
    }
    
    // 验证参与人数限制
    const participantLimit = $('#activity-limit').val();
    if (participantLimit && (parseInt(participantLimit) < 0 || isNaN(parseInt(participantLimit)))) {
        errorMessages.push('参与人数限制必须是非负整数');
        isValid = false;
    }
    
    // 显示错误消息
    if (!isValid) {
        showMessage(errorMessages.join('<br>'), 'error');
    }
    
    return isValid;
}

// 提交活动数据
function submitActivity() {
    // 收集表单数据
    const title = $('#activity-title').val().trim();
    const date = $('#activity-date').val();
    const time = $('#activity-time').val();
    const location = $('#activity-location').val().trim();
    const description = $('#activity-description').val().trim();
    const participantLimit = $('#activity-limit').val() || null;
    const visibility = $('input[name="visibility"]:checked').val();
    
    // 处理标签
    const tagsInput = $('#activity-tags').val().trim();
    let tags = [];
    if (tagsInput) {
        tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    }
    
    // 创建日期时间字符串
    const dateTimeStr = `${date}T${time}:00`;
    
    // 准备表单数据
    const formData = new FormData();
    formData.append('title', title);
    formData.append('date', dateTimeStr);
    formData.append('location', location);
    formData.append('description', description);
    formData.append('visibility', visibility);
    formData.append('club_id', clubId);
    
    // 添加可选字段
    if (participantLimit) {
        formData.append('participant_limit', participantLimit);
    }
    
    if (tags.length > 0) {
        formData.append('tags', JSON.stringify(tags));
    }
    
    // 添加图片文件
    const imageFile = $('#activity-image')[0].files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    // 禁用提交按钮并显示加载状态
    const submitBtn = $('#submit-activity-btn');
    const originalText = submitBtn.html();
    submitBtn.html('<i class="fa fa-spinner fa-spin mr-2"></i>创建中...');
    submitBtn.prop('disabled', true);
    
    // 隐藏之前的消息
    $('#activity-message').hide();
    
    // 提交表单数据
    // 注意：对于文件上传，需要使用FormData对象，并且不设置Content-Type
    fetch(`${API_BASE_URL}/activities/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getToken()}`
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            // 尝试解析错误响应
            return response.json().then(errorData => {
                throw new Error(JSON.stringify(errorData));
            });
        }
        return response.json();
    })
    .then(activity => {
        // 显示成功消息
        showMessage('活动创建成功！即将跳转到活动详情页面...', 'success');
        
        // 2秒后跳转到活动详情页面
        setTimeout(function() {
            window.location.href = `activity-detail.html?id=${activity.id}`;
        }, 2000);
    })
    .catch(error => {
        console.error('创建活动失败:', error);
        
        // 解析错误信息
        let errorMessage = '创建活动失败，请稍后再试';
        try {
            const errorData = JSON.parse(error.message);
            
            if (errorData) {
                // 收集所有错误信息
                const errorDetails = [];
                for (const [key, value] of Object.entries(errorData)) {
                    if (Array.isArray(value)) {
                        errorDetails.push(value.join(', '));
                    } else {
                        errorDetails.push(value);
                    }
                }
                
                if (errorDetails.length > 0) {
                    errorMessage = errorDetails.join('<br>');
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                }
            }
        } catch (e) {
            // 如果解析失败，使用默认错误信息
        }
        
        // 显示错误消息
        showMessage(errorMessage, 'error');
        
        // 恢复按钮状态
        submitBtn.html(originalText);
        submitBtn.prop('disabled', false);
    });
}

// 显示消息
function showMessage(message, type = 'info') {
    const messageContainer = $('#activity-message');
    const messageText = $('#message-text');
    
    // 更新消息内容
    messageText.html(message);
    
    // 更新消息类型
    messageContainer.removeClass('alert-info alert-success alert-danger alert-warning');
    
    switch (type) {
        case 'success':
            messageContainer.addClass('alert-success');
            messageContainer.html(`<i class="fa fa-check-circle mr-2"></i>${message}`);
            break;
        case 'error':
            messageContainer.addClass('alert-danger');
            messageContainer.html(`<i class="fa fa-exclamation-circle mr-2"></i>${message}`);
            break;
        case 'warning':
            messageContainer.addClass('alert-warning');
            messageContainer.html(`<i class="fa fa-exclamation-triangle mr-2"></i>${message}`);
            break;
        default:
            messageContainer.addClass('alert-info');
            messageContainer.html(`<i class="fa fa-info-circle mr-2"></i>${message}`);
    }
    
    // 显示消息
    messageContainer.show();
    
    // 滚动到消息顶部
    window.scrollTo({ top: messageContainer.offset().top - 20, behavior: 'smooth' });
}