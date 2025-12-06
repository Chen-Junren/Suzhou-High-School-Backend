// 活动详情页面脚本

// 全局变量
let activityId = null;
let currentActivity = null;
let userParticipating = false;
let isActivityLeader = false;

$(document).ready(function() {
    // 初始化导航栏状态
    updateNavbar();
    
    // 获取URL中的活动ID
    activityId = getURLParameter('id');
    
    if (!activityId) {
        showMessage('活动ID不存在，请重新访问', 'error');
        return;
    }
    
    // 加载活动详情
    loadActivityDetail();
    
    // 评论表单提交事件
    $('#comment-form').on('submit', function(event) {
        event.preventDefault();
        submitComment();
    });
});

// 加载活动详情
function loadActivityDetail() {
    // 显示加载状态
    $('#loading-container').show();
    $('#activity-container').hide();
    
    apiRequest(`/activities/${activityId}/`, 'GET', null, false)
        .then(function(activity) {
            currentActivity = activity;
            
            // 隐藏加载状态，显示活动内容
            $('#loading-container').hide();
            $('#activity-container').show();
            
            // 更新活动信息
            updateActivityInfo();
            
            // 检查用户参与状态
            checkParticipationStatus();
            
            // 加载参与者列表
            loadParticipants();
            
            // 加载评论
            loadComments();
        })
        .catch(function(error) {
            console.error('加载活动详情失败:', error);
            
            // 隐藏加载状态，显示错误消息
            $('#loading-container').hide();
            showMessage('加载活动详情失败，请稍后再试', 'error');
        });
}

// 更新活动信息
function updateActivityInfo() {
    const activity = currentActivity;
    
    // 活动基本信息
    $('#activity-title').text(activity.title);
    
    // 设置图片，如果没有则使用默认图片
    const imageUrl = activity.image || 'https://via.placeholder.com/1200x600?text=活动图片';
    $('#activity-image').attr('src', imageUrl);
    
    // 格式化日期和时间
    const activityDate = new Date(activity.date);
    const formattedDate = formatDate(activityDate, 'YYYY年MM月DD日');
    const formattedTime = formatDate(activityDate, 'HH:mm');
    
    $('#activity-date').text(formattedDate);
    $('#activity-time').text(formattedTime);
    $('#activity-location').text(activity.location);
    
    // 社团信息
    $('#activity-club-link').attr('href', `club-detail.html?id=${activity.club.id}`);
    $('#activity-club-link').text(activity.club.name);
    
    // 活动描述
    $('#activity-description').html(activity.description.replace(/\n/g, '<br>'));
    
    // 活动统计信息
    $('#participant-count').text(activity.participants ? activity.participants.length : 0);
    $('#comment-count').text(activity.comments ? activity.comments.length : 0);
    $('#view-count').text(activity.view_count || 0);
    
    // 活动状态
    const now = new Date();
    let statusClass = 'bg-primary';
    let statusText = '进行中';
    
    if (activityDate < now) {
        statusClass = 'bg-secondary';
        statusText = '已结束';
    } else {
        // 计算活动开始前的天数
        const diffDays = Math.ceil((activityDate - now) / (1000 * 60 * 60 * 24));
        if (diffDays > 7) {
            statusText = '即将开始';
        } else if (diffDays === 0) {
            statusText = '今天开始';
        } else {
            statusText = `${diffDays}天后开始`;
        }
    }
    
    $('#activity-status').removeClass('bg-primary bg-secondary bg-success bg-warning bg-danger');
    $('#activity-status').addClass(statusClass);
    $('#activity-status').text(statusText);
    
    // 活动标签
    const tagsContainer = $('#activity-tags');
    tagsContainer.empty();
    
    if (activity.tags && activity.tags.length > 0) {
        activity.tags.forEach(tag => {
            tagsContainer.append(`<span class="tag">${tag}</span>`);
        });
    } else {
        tagsContainer.append('<span class="text-muted">暂无标签</span>');
    }
    
    // 增加浏览次数
    incrementViewCount();
}

// 增加浏览次数
function incrementViewCount() {
    // 使用fetch而不是apiRequest，因为这个请求不需要token
    fetch(`${API_BASE_URL}/activities/${activityId}/view/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }).catch(error => {
        // 浏览次数增加失败不影响页面展示，只记录日志
        console.error('增加浏览次数失败:', error);
    });
}

// 检查用户参与状态
function checkParticipationStatus() {
    const user = getUser();
    const actionButtons = $('#action-buttons');
    actionButtons.empty();
    
    // 检查是否已登录
    if (!user) {
        actionButtons.append(`
            <a href="login.html?next=activity-detail.html?id=${activityId}" class="btn btn-primary">
                <i class="fa fa-sign-in-alt mr-2"></i>登录参与活动
            </a>
        `);
        return;
    }
    
    // 检查用户是否是社团领导者（活动创建者）
    if (user.id === currentActivity.club.leader.id) {
        isActivityLeader = true;
        actionButtons.append(`
            <a href="edit-activity.html?id=${activityId}" class="btn btn-warning">
                <i class="fa fa-edit mr-2"></i>编辑活动
            </a>
            <button class="btn btn-danger" onclick="confirmDeleteActivity()">
                <i class="fa fa-trash mr-2"></i>删除活动
            </button>
        `);
    }
    
    // 检查活动是否已结束
    const activityDate = new Date(currentActivity.date);
    const isPast = activityDate < new Date();
    
    if (isPast) {
        actionButtons.prepend(`
            <div class="alert alert-info" role="alert">
                <i class="fa fa-info-circle mr-2"></i>该活动已结束
            </div>
        `);
        return;
    }
    
    // 检查用户是否已参与
    if (currentActivity.participants) {
        userParticipating = currentActivity.participants.some(p => p.id === user.id);
    }
    
    // 检查是否已达到参与人数限制
    const isFull = currentActivity.participant_limit && 
                   currentActivity.participants && 
                   currentActivity.participants.length >= currentActivity.participant_limit;
    
    // 显示相应按钮
    if (userParticipating) {
        actionButtons.prepend(`
            <button class="btn btn-danger" onclick="cancelParticipation()">
                <i class="fa fa-times mr-2"></i>取消参与
            </button>
        `);
    } else if (!isFull) {
        actionButtons.prepend(`
            <button class="btn btn-primary" onclick="joinActivity()">
                <i class="fa fa-plus mr-2"></i>参与活动
            </button>
        `);
    } else {
        actionButtons.prepend(`
            <div class="alert alert-warning" role="alert">
                <i class="fa fa-exclamation-triangle mr-2"></i>活动参与人数已满
            </div>
        `);
    }
    
    // 显示评论表单
    $('#comment-form-container').show();
}

// 参与活动
function joinActivity() {
    apiRequest(`/activities/${activityId}/participate/`, 'POST', null, true)
        .then(function(response) {
            showMessage('成功参与活动！', 'success');
            
            // 更新参与状态
            userParticipating = true;
            
            // 重新加载活动详情
            loadActivityDetail();
        })
        .catch(function(error) {
            console.error('参与活动失败:', error);
            
            let errorMessage = '参与活动失败，请稍后再试';
            if (error.response && error.response.data && error.response.data.detail) {
                errorMessage = error.response.data.detail;
            }
            
            showMessage(errorMessage, 'error');
        });
}

// 取消参与
function cancelParticipation() {
    if (!confirm('确定要取消参与该活动吗？')) {
        return;
    }
    
    apiRequest(`/activities/${activityId}/participate/`, 'DELETE', null, true)
        .then(function(response) {
            showMessage('已取消参与活动', 'info');
            
            // 更新参与状态
            userParticipating = false;
            
            // 重新加载活动详情
            loadActivityDetail();
        })
        .catch(function(error) {
            console.error('取消参与失败:', error);
            
            let errorMessage = '取消参与失败，请稍后再试';
            if (error.response && error.response.data && error.response.data.detail) {
                errorMessage = error.response.data.detail;
            }
            
            showMessage(errorMessage, 'error');
        });
}

// 确认删除活动
function confirmDeleteActivity() {
    if (!confirm('确定要删除该活动吗？此操作不可撤销。')) {
        return;
    }
    
    apiRequest(`/activities/${activityId}/`, 'DELETE', null, true)
        .then(function(response) {
            showMessage('活动已成功删除', 'success');
            
            // 3秒后跳转到社团详情页
            setTimeout(function() {
                window.location.href = `club-detail.html?id=${currentActivity.club.id}`;
            }, 3000);
        })
        .catch(function(error) {
            console.error('删除活动失败:', error);
            
            let errorMessage = '删除活动失败，请稍后再试';
            if (error.response && error.response.data && error.response.data.detail) {
                errorMessage = error.response.data.detail;
            }
            
            showMessage(errorMessage, 'error');
        });
}

// 加载参与者列表
function loadParticipants() {
    const participantsContainer = $('#participants-container');
    participantsContainer.empty();
    
    if (!currentActivity.participants || currentActivity.participants.length === 0) {
        participantsContainer.append(`
            <div class="text-center w-100 py-5">
                <i class="fa fa-users text-4xl text-muted mb-3"></i>
                <p class="text-muted">暂无参与者</p>
            </div>
        `);
        return;
    }
    
    // 显示参与者列表
    currentActivity.participants.forEach(participant => {
        const participantCard = `
            <div class="participant-card">
                <img src="https://via.placeholder.com/40" alt="${participant.username}" class="participant-avatar">
                <div class="participant-info">
                    <p class="participant-name">${participant.username}</p>
                    <p class="participant-joined">
                        <i class="fa fa-calendar-plus text-sm mr-1"></i>
                        ${formatDate(participant.joined_at || new Date(), 'YYYY-MM-DD')}
                    </p>
                </div>
            </div>
        `;
        participantsContainer.append(participantCard);
    });
}

// 加载评论
function loadComments() {
    const commentsContainer = $('#comments-container');
    commentsContainer.empty();
    
    if (!currentActivity.comments || currentActivity.comments.length === 0) {
        commentsContainer.append(`
            <div class="text-center w-100 py-5">
                <i class="fa fa-comment-slash text-4xl text-muted mb-3"></i>
                <p class="text-muted">暂无评论</p>
            </div>
        `);
        return;
    }
    
    // 按时间倒序排序评论
    const sortedComments = [...currentActivity.comments].sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
    });
    
    // 显示评论列表
    sortedComments.forEach(comment => {
        const commentCard = `
            <div class="comment-card">
                <div class="comment-header">
                    <div class="comment-author">
                        <img src="https://via.placeholder.com/40" alt="${comment.author.username}" class="participant-avatar">
                        <p class="comment-author-name">${comment.author.username}</p>
                    </div>
                    <span class="comment-date">${formatDate(comment.created_at)}</span>
                </div>
                <div class="comment-content">${comment.content.replace(/\n/g, '<br>')}</div>
            </div>
        `;
        commentsContainer.append(commentCard);
    });
}

// 提交评论
function submitComment() {
    const content = $('#comment-content').val().trim();
    
    if (!content) {
        showMessage('请输入评论内容', 'error');
        return;
    }
    
    if (content.length > 500) {
        showMessage('评论内容不能超过500个字符', 'error');
        return;
    }
    
    // 禁用提交按钮
    const submitBtn = $('#comment-form button[type="submit"]');
    const originalText = submitBtn.html();
    submitBtn.html('<i class="fa fa-spinner fa-spin mr-2"></i>提交中...');
    submitBtn.prop('disabled', true);
    
    const commentData = {
        content: content,
        activity_id: activityId
    };
    
    apiRequest('/comments/', 'POST', commentData, true)
        .then(function(comment) {
            showMessage('评论发表成功！', 'success');
            
            // 清空评论框
            $('#comment-content').val('');
            
            // 重新加载活动详情
            loadActivityDetail();
        })
        .catch(function(error) {
            console.error('发表评论失败:', error);
            
            let errorMessage = '发表评论失败，请稍后再试';
            if (error.response && error.response.data && error.response.data.detail) {
                errorMessage = error.response.data.detail;
            }
            
            showMessage(errorMessage, 'error');
            
            // 恢复按钮状态
            submitBtn.html(originalText);
            submitBtn.prop('disabled', false);
        });
}

// 显示消息
function showMessage(message, type = 'info') {
    const messageContainer = $('#activity-message');
    
    // 更新消息内容
    messageContainer.html(`<i class="fa fa-info-circle mr-2"></i>${message}`);
    
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
    
    // 如果是成功或错误消息，3秒后自动隐藏
    if (type === 'success' || type === 'error') {
        setTimeout(function() {
            messageContainer.fadeOut(500);
        }, 3000);
    }
}