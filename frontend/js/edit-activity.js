// 编辑活动页面脚本
// API基础URL - 在实际部署时需要修改为真实的后端API地址
const API_BASE_URL = 'http://localhost:8000/api';

// 活动ID，从URL参数获取
let activityId = null;

// 当前用户信息
let currentUser = null;

// DOM加载完成后初始化页面
$(document).ready(function() {
    // 初始化导航栏
    initNavbar();
    
    // 获取活动ID
    activityId = getActivityIdFromUrl();
    
    if (!activityId) {
        showError('无法获取活动ID，请检查URL');
        return;
    }
    
    // 验证用户登录状态和权限
    checkUserLogin();
});

/**
 * 从URL获取活动ID
 */
function getActivityIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

/**
 * 检查用户登录状态和权限
 */
function checkUserLogin() {
    currentUser = getCurrentUser();
    
    if (!currentUser) {
        showError('请先登录');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    // 加载活动信息并检查权限
    loadActivityData();
}

/**
 * 加载活动数据
 */
function loadActivityData() {
    $.ajax({
        url: `${API_BASE_URL}/activities/${activityId}`,
        type: 'GET',
        headers: {
            'Authorization': `Bearer ${currentUser.token}`
        },
        success: function(data) {
            // 检查用户权限
            checkUserPermission(data);
            
            // 填充表单数据
            fillFormWithActivityData(data);
            
            // 显示表单，隐藏加载状态
            $('#loading-container').hide();
            $('#activity-form-container').show();
        },
        error: function(xhr, status, error) {
            console.error('加载活动信息失败:', error);
            const errorMessage = xhr.responseJSON?.message || '加载活动信息失败，请稍后再试';
            showError(errorMessage);
        }
    });
}

/**
 * 检查用户是否有编辑权限
 */
function checkUserPermission(activityData) {
    // 检查用户是否是活动所属社团的领导者
    const userIsLeader = activityData.club && 
                         activityData.club.leader && 
                         activityData.club.leader.id === currentUser.id;
    
    // 检查用户是否是活动的创建者
    const userIsCreator = activityData.creator && activityData.creator.id === currentUser.id;
    
    // 如果用户既不是领导者也不是创建者，显示错误并阻止编辑
    if (!userIsLeader && !userIsCreator) {
        showError('您没有权限编辑此活动');
        // 禁用表单
        $('#edit-activity-form').find('input, textarea, select, button').prop('disabled', true);
    }
}

/**
 * 用活动数据填充表单
 */
function fillFormWithActivityData(activity) {
    // 基本信息
    $('#activity-title').val(activity.title);
    
    // 日期和时间处理
    if (activity.start_time) {
        const eventDate = new Date(activity.start_time);
        $('#activity-date').val(eventDate.toISOString().split('T')[0]);
        $('#activity-time').val(eventDate.toTimeString().split(' ')[0].substring(0, 5));
    }
    
    $('#activity-location').val(activity.location || '');
    $('#activity-description').val(activity.description || '');
    
    // 人数限制
    if (activity.participant_limit && activity.participant_limit > 0) {
        $('#activity-limit').val(activity.participant_limit);
    }
    
    // 图片处理
    if (activity.image_url) {
        $('#current-image-container').show();
        $('#current-image').attr('src', activity.image_url);
    }
    
    // 标签处理
    if (activity.tags && activity.tags.length > 0) {
        $('#activity-tags').val(activity.tags.join(', '));
    }
    
    // 可见性设置
    if (activity.visibility === 'club') {
        $('#visibility-club').prop('checked', true);
    } else {
        $('#visibility-public').prop('checked', true);
    }
}

/**
 * 设置图片预览功能
 */
$('#activity-image').on('change', function(e) {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            $('#image-preview').attr('src', event.target.result);
            $('#image-preview-container').show();
        }
        
        reader.readAsDataURL(e.target.files[0]);
    }
});

/**
 * 表单提交处理
 */
$('#edit-activity-form').on('submit', function(e) {
    e.preventDefault();
    
    // 表单验证
    if (!validateForm()) {
        return;
    }
    
    // 禁用提交按钮防止重复提交
    const submitBtn = $('#submit-activity-btn');
    const originalBtnText = submitBtn.html();
    submitBtn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin mr-2"></i>保存中...');
    
    // 准备表单数据
    const formData = new FormData();
    
    // 活动基本信息
    formData.append('title', $('#activity-title').val().trim());
    
    // 组合日期和时间
    const date = $('#activity-date').val();
    const time = $('#activity-time').val();
    formData.append('start_time', `${date}T${time}:00`);
    
    formData.append('location', $('#activity-location').val().trim());
    formData.append('description', $('#activity-description').val().trim());
    
    // 处理人数限制
    const limit = $('#activity-limit').val().trim();
    formData.append('participant_limit', limit ? parseInt(limit) : 0);
    
    // 处理标签
    const tagsInput = $('#activity-tags').val().trim();
    if (tagsInput) {
        const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
        formData.append('tags', JSON.stringify(tags));
    }
    
    // 可见性
    formData.append('visibility', $('input[name="visibility"]:checked').val());
    
    // 处理删除图片选项
    if ($('#remove-image').is(':checked')) {
        formData.append('remove_image', 'true');
    }
    
    // 处理新上传的图片
    const imageFile = $('#activity-image')[0].files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    // 发送更新请求
    $.ajax({
        url: `${API_BASE_URL}/activities/${activityId}`,
        type: 'PUT',
        data: formData,
        processData: false,
        contentType: false,
        headers: {
            'Authorization': `Bearer ${currentUser.token}`
        },
        success: function(response) {
            showMessage('活动更新成功！', 'success');
            
            // 延迟后跳转到活动详情页
            setTimeout(() => {
                window.location.href = `activity-detail.html?id=${activityId}`;
            }, 2000);
        },
        error: function(xhr, status, error) {
            console.error('更新活动失败:', error);
            const errorMessage = xhr.responseJSON?.message || '更新活动失败，请稍后再试';
            showError(errorMessage);
            
            // 恢复提交按钮状态
            submitBtn.prop('disabled', false).html(originalBtnText);
        }
    });
});

/**
 * 表单验证
 */
function validateForm() {
    let isValid = true;
    let errorMessage = '';
    
    // 验证标题
    const title = $('#activity-title').val().trim();
    if (!title) {
        errorMessage += '请输入活动标题<br>';
        isValid = false;
    } else if (title.length > 100) {
        errorMessage += '活动标题不能超过100个字符<br>';
        isValid = false;
    }
    
    // 验证日期和时间
    const date = $('#activity-date').val();
    const time = $('#activity-time').val();
    if (!date) {
        errorMessage += '请选择活动日期<br>';
        isValid = false;
    }
    if (!time) {
        errorMessage += '请选择活动时间<br>';
        isValid = false;
    }
    
    // 验证未来时间
    if (date && time) {
        const selectedDateTime = new Date(`${date}T${time}`);
        const now = new Date();
        if (selectedDateTime <= now) {
            errorMessage += '活动时间必须是未来的时间<br>';
            isValid = false;
        }
    }
    
    // 验证地点
    const location = $('#activity-location').val().trim();
    if (!location) {
        errorMessage += '请输入活动地点<br>';
        isValid = false;
    } else if (location.length > 200) {
        errorMessage += '活动地点不能超过200个字符<br>';
        isValid = false;
    }
    
    // 验证描述
    const description = $('#activity-description').val().trim();
    if (!description) {
        errorMessage += '请输入活动描述<br>';
        isValid = false;
    } else if (description.length < 10) {
        errorMessage += '活动描述至少需要10个字符<br>';
        isValid = false;
    }
    
    // 验证图片大小
    const imageFile = $('#activity-image')[0].files[0];
    if (imageFile && imageFile.size > 5 * 1024 * 1024) { // 5MB限制
        errorMessage += '上传的图片大小不能超过5MB<br>';
        isValid = false;
    }
    
    // 显示错误信息
    if (!isValid) {
        showError(errorMessage);
    }
    
    return isValid;
}

/**
 * 显示错误信息
 */
function showError(message) {
    $('#loading-container').hide();
    $('#error-container').html(`<i class="fa fa-exclamation-circle mr-2"></i>${message}`);
    $('#error-container').show();
    $('#activity-form-container').hide();
}

/**
 * 显示普通消息
 */
function showMessage(message, type = 'info') {
    const alertClass = type === 'success' ? 'alert-success' : 'alert-info';
    const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-info-circle';
    
    const messageContainer = $('#activity-message');
    messageContainer.removeClass('alert-info alert-success alert-danger').addClass(alertClass);
    messageContainer.html(`<i class="fa ${iconClass} mr-2"></i>${message}`);
    messageContainer.show();
    
    // 滚动到消息区域
    messageContainer[0].scrollIntoView({ behavior: 'smooth', block: 'top' });
}

/**
 * 获取当前登录用户
 */
function getCurrentUser() {
    const userJson = localStorage.getItem('user');
    try {
        return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
        console.error('解析用户信息失败:', e);
        return null;
    }
}

/**
 * 初始化导航栏
 */
function initNavbar() {
    // 从通用脚本导入或在这里直接实现
    // 这里简单实现一下
    const user = getCurrentUser();
    const userMenu = $('#user-menu');
    
    if (user) {
        // 登录状态
        userMenu.html(`
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fa fa-user-circle mr-1"></i>${user.username}
                </a>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                    <li><a class="dropdown-item" href="profile.html"><i class="fa fa-user mr-1"></i>个人资料</a></li>
                    <li><a class="dropdown-item" href="my-activities.html"><i class="fa fa-calendar-check mr-1"></i>我的活动</a></li>
                    <li><a class="dropdown-item" href="clubs.html"><i class="fa fa-building mr-1"></i>我的社团</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="logout()"><i class="fa fa-sign-out-alt mr-1"></i>退出登录</a></li>
                </ul>
            </li>
        `);
    } else {
        // 未登录状态
        userMenu.html(`
            <li class="nav-item">
                <a class="nav-link" href="login.html"><i class="fa fa-sign-in-alt mr-1"></i>登录</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="register.html"><i class="fa fa-user-plus mr-1"></i>注册</a>
            </li>
        `);
    }
}

/**
 * 退出登录
 */
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}