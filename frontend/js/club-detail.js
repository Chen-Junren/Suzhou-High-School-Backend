// 社团详情页面脚本

// 全局变量
let clubId = null;
let currentClub = null;
let isMember = false;
let isLeader = false;

$(document).ready(function() {
    // 初始化导航栏状态
    updateNavbar();
    
    // 获取URL中的社团ID
    clubId = getURLParameter('id');
    
    if (!clubId) {
        showMessage('社团ID不存在，请重新访问', 'error');
        return;
    }
    
    // 加载社团详情
    loadClubDetails();
    
    // 成员搜索事件
    $('#member-search').on('input', function() {
        filterMembers();
    });
    
    // 创建活动按钮点击事件
    $('#create-activity-btn').on('click', function() {
        // 跳转到活动创建页面，传递社团ID
        window.location.href = `create-activity.html?club_id=${clubId}`;
    });
});

// 加载社团详情
function loadClubDetails() {
    // 显示加载状态
    $('#club-name').text('加载中...');
    $('#action-buttons .loading-spinner').show();
    
    apiRequest(`/clubs/${clubId}/`, 'GET', null, false)
        .then(function(club) {
            currentClub = club;
            
            // 更新社团信息
            updateClubInfo(club);
            
            // 检查用户是否是成员或领导者
            checkUserStatus(club);
            
            // 加载成员列表
            loadMembers(club.members);
            
            // 加载活动列表
            loadActivities();
        })
        .catch(function(error) {
            console.error('加载社团详情失败:', error);
            showMessage('加载社团详情失败，请稍后再试', 'error');
            
            // 隐藏加载状态
            $('#action-buttons .loading-spinner').hide();
        });
}

// 更新社团信息
function updateClubInfo(club) {
    // 基本信息
    $('#club-name').text(club.name);
    $('#club-description').text(club.description);
    $('#club-category').text(club.category);
    $('#club-created').text(`创建于: ${formatDate(club.created_at)}`);
    
    // 统计信息
    $('#member-count').text(club.members.length);
    $('#activity-count').text(club.activities ? club.activities.length : 0);
    $('#join-date').text(formatDate(club.created_at, 'YYYY-MM-DD'));
    
    // 详细信息
    $('#detailed-description').text(club.description);
    $('#contact-info').html(`
        <p><i class="fa fa-envelope mr-2"></i>${club.email || '未提供'}</p>
        <p><i class="fa fa-phone mr-2"></i>${club.phone || '未提供'}</p>
    `);
    
    // 负责人信息
    $('#leader-info').html(`
        <img src="https://via.placeholder.com/50" alt="${club.leader.username}" class="member-avatar mr-3">
        <div>
            <h5 class="mb-0">${club.leader.username}</h5>
            <p class="text-muted mb-0">社团负责人</p>
        </div>
    `);
    
    // 隐藏加载状态
    $('#action-buttons .loading-spinner').hide();
}

// 检查用户状态（是否是成员或领导者）
function checkUserStatus(club) {
    const user = getUser();
    const actionButtons = $('#action-buttons');
    actionButtons.empty();
    
    if (!user) {
        // 未登录用户
        actionButtons.append(`
            <a href="login.html?next=club-detail.html?id=${clubId}" class="btn btn-primary w-100">
                <i class="fa fa-sign-in mr-2"></i>登录查看
            </a>
        `);
        return;
    }
    
    // 检查是否是成员
    isMember = club.members.some(member => member.id === user.id);
    
    // 检查是否是领导者
    isLeader = club.leader.id === user.id;
    
    if (isLeader) {
        // 领导者权限
        actionButtons.append(`
            <a href="manage-club.html?id=${clubId}" class="btn btn-primary w-100 mb-2">
                <i class="fa fa-cog mr-2"></i>管理社团
            </a>
        `);
        
        // 显示创建活动按钮
        $('#create-activity-btn').show();
    } else if (isMember) {
        // 成员权限
        actionButtons.append(`
            <button class="btn btn-outline-warning w-100" onclick="leaveClub()">
                <i class="fa fa-sign-out mr-2"></i>退出社团
            </button>
        `);
    } else {
        // 非成员，可以加入
        actionButtons.append(`
            <button class="btn btn-outline-success w-100" onclick="joinClub()">
                <i class="fa fa-sign-in mr-2"></i>申请加入
            </button>
        `);
    }
}

// 加载成员列表
function loadMembers(members) {
    const membersList = $('#members-list');
    membersList.empty();
    
    if (!members || members.length === 0) {
        membersList.append($('#no-data-message').clone().removeClass('d-none'));
        return;
    }
    
    // 创建表格
    const table = $('<table class="table table-hover">');
    table.append(`
        <thead>
            <tr>
                <th>头像</th>
                <th>用户名</th>
                <th>角色</th>
                <th>加入时间</th>
                ${isLeader ? '<th>操作</th>' : ''}
            </tr>
        </thead>
        <tbody id="members-table-body">
            <!-- 成员数据将动态填充 -->
        </tbody>
    `);
    
    membersList.append(table);
    
    // 填充成员数据
    const tableBody = $('#members-table-body');
    members.forEach(function(member) {
        const isMemberLeader = member.id === currentClub.leader.id;
        const role = isMemberLeader ? '负责人' : '成员';
        
        let rowHTML = `
            <tr>
                <td>
                    <img src="https://via.placeholder.com/40" alt="${member.username}" class="member-avatar">
                </td>
                <td>${member.username}</td>
                <td>
                    <span class="badge ${isMemberLeader ? 'bg-primary' : 'bg-secondary'}">${role}</span>
                </td>
                <td>${formatDate(member.joined_at || currentClub.created_at)}</td>
        `;
        
        // 领导者可以管理成员
        if (isLeader && !isMemberLeader) {
            rowHTML += `
                <td>
                    <button class="btn btn-outline-danger btn-sm" onclick="removeMember(${member.id}, this)">
                        <i class="fa fa-trash mr-1"></i>移除
                    </button>
                </td>
            `;
        }
        
        rowHTML += `</tr>`;
        tableBody.append(rowHTML);
    });
}

// 筛选成员
function filterMembers() {
    const searchTerm = $('#member-search').val().toLowerCase();
    const tableRows = $('#members-table-body tr');
    
    tableRows.each(function() {
        const username = $(this).find('td:nth-child(2)').text().toLowerCase();
        if (username.includes(searchTerm)) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });
}

// 加载活动列表
function loadActivities() {
    const activitiesList = $('#activities-list');
    activitiesList.empty();
    
    // 显示加载状态
    activitiesList.append($('#loading-message').clone().removeClass('d-none'));
    
    apiRequest(`/clubs/${clubId}/activities/`, 'GET', null, false)
        .then(function(activities) {
            activitiesList.empty();
            
            if (!activities || activities.length === 0) {
                activitiesList.append($('#no-data-message').clone().removeClass('d-none'));
                return;
            }
            
            // 渲染活动卡片
            activities.forEach(function(activity) {
                const activityCard = createActivityCard(activity);
                activitiesList.append(activityCard);
            });
        })
        .catch(function(error) {
            console.error('加载活动列表失败:', error);
            
            activitiesList.empty();
            activitiesList.append(`
                <div class="col-12 text-center py-5">
                    <i class="fa fa-exclamation-circle text-5xl text-danger mb-3"></i>
                    <p>加载活动列表失败</p>
                </div>
            `);
        });
}

// 创建活动卡片
function createActivityCard(activity) {
    const now = new Date();
    const activityDate = new Date(activity.date);
    const isPast = activityDate < now;
    const isFuture = activityDate > now;
    
    let statusClass = '';
    let statusText = '';
    
    if (isPast) {
        statusClass = 'bg-secondary';
        statusText = '已结束';
    } else if (isFuture) {
        statusClass = 'bg-success';
        statusText = '即将开始';
    } else {
        statusClass = 'bg-warning';
        statusText = '正在进行';
    }
    
    const cardHtml = `
        <div class="col-md-6 mb-4">
            <div class="card activity-card h-100">
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0">${activity.title}</h5>
                        <span class="badge ${statusClass}">${statusText}</span>
                    </div>
                </div>
                <div class="card-body">
                    <p class="card-text">${activity.description}</p>
                    <div class="mt-3">
                        <p class="mb-1"><i class="fa fa-calendar-alt mr-2"></i>${formatDate(activity.date, 'YYYY-MM-DD HH:mm')}</p>
                        <p class="mb-1"><i class="fa fa-map-marker-alt mr-2"></i>${activity.location}</p>
                        <p class="mb-1"><i class="fa fa-user mr-2"></i>负责人: ${activity.organizer.username}</p>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="d-flex justify-content-between">
                        <span class="text-muted">报名人数: ${activity.participants ? activity.participants.length : 0}</span>
                        <a href="activity-detail.html?id=${activity.id}" class="btn btn-outline-primary btn-sm">
                            <i class="fa fa-eye mr-1"></i>详情
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return cardHtml;
}

// 加入社团
function joinClub() {
    // 显示加载状态
    const actionButtons = $('#action-buttons');
    const originalContent = actionButtons.html();
    actionButtons.html(`
        <div class="loading-spinner">
            <i class="fa fa-spinner fa-spin text-3xl"></i>
        </div>
    `);
    
    apiRequest(`/clubs/${clubId}/join/`, 'POST', null, true)
        .then(function(response) {
            showMessage('成功加入社团', 'success');
            
            // 重新加载社团详情
            loadClubDetails();
        })
        .catch(function(error) {
            console.error('加入社团失败:', error);
            
            let errorMessage = '加入社团失败';
            if (error.response && error.response.data && error.response.data.detail) {
                errorMessage = error.response.data.detail;
            }
            
            showMessage(errorMessage, 'error');
            
            // 恢复按钮状态
            actionButtons.html(originalContent);
        });
}

// 退出社团
function leaveClub() {
    // 确认退出
    if (!confirm('确定要退出该社团吗？')) {
        return;
    }
    
    // 显示加载状态
    const actionButtons = $('#action-buttons');
    const originalContent = actionButtons.html();
    actionButtons.html(`
        <div class="loading-spinner">
            <i class="fa fa-spinner fa-spin text-3xl"></i>
        </div>
    `);
    
    apiRequest(`/clubs/${clubId}/leave/`, 'POST', null, true)
        .then(function(response) {
            showMessage('成功退出社团', 'success');
            
            // 重新加载社团详情
            loadClubDetails();
        })
        .catch(function(error) {
            console.error('退出社团失败:', error);
            
            let errorMessage = '退出社团失败';
            if (error.response && error.response.data && error.response.data.detail) {
                errorMessage = error.response.data.detail;
            }
            
            showMessage(errorMessage, 'error');
            
            // 恢复按钮状态
            actionButtons.html(originalContent);
        });
}

// 移除成员（仅领导者可操作）
function removeMember(memberId, button) {
    // 确认移除
    if (!confirm('确定要移除该成员吗？')) {
        return;
    }
    
    // 显示加载状态
    const originalContent = $(button).html();
    $(button).html('<i class="fa fa-spinner fa-spin"></i>移除中...');
    $(button).prop('disabled', true);
    
    apiRequest(`/clubs/${clubId}/members/${memberId}/remove/`, 'POST', null, true)
        .then(function(response) {
            showMessage('成功移除成员', 'success');
            
            // 重新加载社团详情
            loadClubDetails();
        })
        .catch(function(error) {
            console.error('移除成员失败:', error);
            
            let errorMessage = '移除成员失败';
            if (error.response && error.response.data && error.response.data.detail) {
                errorMessage = error.response.data.detail;
            }
            
            showMessage(errorMessage, 'error');
            
            // 恢复按钮状态
            $(button).html(originalContent);
            $(button).prop('disabled', false);
        });
}