// 社团管理页面脚本

// 全局变量
let clubId = null;
let currentClub = null;

$(document).ready(function() {
    // 初始化导航栏状态
    updateNavbar();
    
    // 检查用户登录状态
    if (!isLoggedIn()) {
        window.location.href = `login.html?next=manage-club.html?id=${getURLParameter('id')}`;
        return;
    }
    
    // 获取URL中的社团ID
    clubId = getURLParameter('id');
    
    if (!clubId) {
        showMessage('社团ID不存在，请重新访问', 'error');
        return;
    }
    
    // 初始化侧边栏切换
    $('.sidebar a').on('click', function(event) {
        event.preventDefault();
        
        // 更新侧边栏选中状态
        $('.sidebar a').removeClass('active');
        $(this).addClass('active');
        
        // 显示对应的内容区域
        const section = $(this).data('section');
        $('.tab-content').addClass('d-none');
        $(`#${section}-section`).removeClass('d-none');
        $(`#${section}-section`).addClass('active');
        
        // 根据选中的部分加载数据
        if (section === 'members') {
            loadMembers();
        } else if (section === 'applications') {
            loadApplications();
        } else if (section === 'activities') {
            loadActivities();
        } else if (section === 'settings') {
            loadSettings();
        }
    });
    
    // 成员搜索事件
    $('#member-search').on('input', function() {
        filterMembers();
    });
    
    // 创建活动按钮点击事件
    $('#create-activity-btn').on('click', function() {
        window.location.href = `create-activity.html?club_id=${clubId}`;
    });
    
    // 社团设置表单提交事件
    $('#club-settings-form').on('submit', function(event) {
        event.preventDefault();
        saveSettings();
    });
    
    // 加载社团基本信息
    loadClubInfo();
});

// 加载社团基本信息
function loadClubInfo() {
    apiRequest(`/clubs/${clubId}/`, 'GET', null, false)
        .then(function(club) {
            currentClub = club;
            
            // 更新页面标题和描述
            $('#club-name').text(club.name);
            $('#club-description').text(club.description);
            
            // 检查用户是否是领导者
            const user = getUser();
            if (user.id !== club.leader.id) {
                showMessage('您没有权限管理该社团', 'error');
                setTimeout(function() {
                    window.location.href = `club-detail.html?id=${clubId}`;
                }, 2000);
                return;
            }
            
            // 默认加载成员管理
            loadMembers();
        })
        .catch(function(error) {
            console.error('加载社团信息失败:', error);
            showMessage('加载社团信息失败，请稍后再试', 'error');
        });
}

// 加载成员列表
function loadMembers() {
    const tableBody = $('#members-table-body');
    tableBody.empty();
    
    // 显示加载状态
    tableBody.append(`
        <tr>
            <td colspan="5" class="text-center">
                <div class="loading-spinner">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">加载中...</span>
                    </div>
                    <p class="mt-3">正在加载成员列表...</p>
                </div>
            </td>
        </tr>
    `);
    
    apiRequest(`/clubs/${clubId}/members/`, 'GET', null, false)
        .then(function(members) {
            tableBody.empty();
            
            if (!members || members.length === 0) {
                tableBody.append(`
                    <tr>
                        <td colspan="5" class="text-center py-5">
                            <i class="fa fa-users text-5xl text-muted mb-3"></i>
                            <p class="text-muted">暂无成员</p>
                        </td>
                    </tr>
                `);
                return;
            }
            
            // 填充成员数据
            members.forEach(function(member) {
                const isLeader = member.id === currentClub.leader.id;
                const role = isLeader ? '负责人' : '成员';
                
                let rowHTML = `
                    <tr class="member-row">
                        <td>
                            <img src="https://via.placeholder.com/40" alt="${member.username}" class="member-avatar">
                        </td>
                        <td>${member.username}</td>
                        <td>
                            <span class="badge ${isLeader ? 'bg-primary' : 'bg-secondary'}">${role}</span>
                        </td>
                        <td>${formatDate(member.joined_at || currentClub.created_at)}</td>
                `;
                
                // 负责人不能被移除
                if (!isLeader) {
                    rowHTML += `
                        <td>
                            <button class="btn btn-outline-danger btn-sm" onclick="removeMember(${member.id}, this)">
                                <i class="fa fa-trash mr-1"></i>移除
                            </button>
                        </td>
                    `;
                } else {
                    rowHTML += `<td></td>`;
                }
                
                rowHTML += `</tr>`;
                tableBody.append(rowHTML);
            });
        })
        .catch(function(error) {
            console.error('加载成员列表失败:', error);
            
            tableBody.empty();
            tableBody.append(`
                <tr>
                    <td colspan="5" class="text-center py-5">
                        <i class="fa fa-exclamation-circle text-5xl text-danger mb-3"></i>
                        <p>加载成员列表失败</p>
                    </td>
                </tr>
            `);
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

// 移除成员
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
            
            // 重新加载成员列表
            loadMembers();
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

// 加载加入申请
function loadApplications() {
    const tableBody = $('#applications-table-body');
    tableBody.empty();
    
    // 显示加载状态
    tableBody.append(`
        <tr>
            <td colspan="4" class="text-center">
                <div class="loading-spinner">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">加载中...</span>
                    </div>
                    <p class="mt-3">正在加载申请列表...</p>
                </div>
            </td>
        </tr>
    `);
    
    apiRequest(`/clubs/${clubId}/applications/`, 'GET', null, false)
        .then(function(applications) {
            tableBody.empty();
            
            if (!applications || applications.length === 0) {
                tableBody.append(`
                    <tr>
                        <td colspan="4" class="text-center py-5">
                            <i class="fa fa-clipboard-list text-5xl text-muted mb-3"></i>
                            <p class="text-muted">暂无加入申请</p>
                        </td>
                    </tr>
                `);
                return;
            }
            
            // 填充申请数据
            applications.forEach(function(application) {
                let statusClass = '';
                let statusText = '';
                let actionButtons = '';
                let rowClass = '';
                
                switch (application.status) {
                    case 'pending':
                        statusClass = 'badge-warning';
                        statusText = '待审核';
                        rowClass = 'approval-pending';
                        actionButtons = `
                            <div class="btn-group">
                                <button class="btn btn-outline-success btn-sm" onclick="approveApplication(${application.id}, this)">
                                    <i class="fa fa-check mr-1"></i>批准
                                </button>
                                <button class="btn btn-outline-danger btn-sm" onclick="rejectApplication(${application.id}, this)">
                                    <i class="fa fa-times mr-1"></i>拒绝
                                </button>
                            </div>
                        `;
                        break;
                    case 'approved':
                        statusClass = 'badge-success';
                        statusText = '已批准';
                        break;
                    case 'rejected':
                        statusClass = 'badge-danger';
                        statusText = '已拒绝';
                        break;
                }
                
                const rowHTML = `
                    <tr class="${rowClass}">
                        <td>
                            <div class="d-flex align-items-center">
                                <img src="https://via.placeholder.com/40" alt="${application.applicant.username}" class="member-avatar mr-3">
                                <span>${application.applicant.username}</span>
                            </div>
                        </td>
                        <td>${formatDate(application.created_at)}</td>
                        <td>
                            <span class="badge ${statusClass}">${statusText}</span>
                        </td>
                        <td>${actionButtons}</td>
                    </tr>
                `;
                
                tableBody.append(rowHTML);
            });
        })
        .catch(function(error) {
            console.error('加载申请列表失败:', error);
            
            tableBody.empty();
            tableBody.append(`
                <tr>
                    <td colspan="4" class="text-center py-5">
                        <i class="fa fa-exclamation-circle text-5xl text-danger mb-3"></i>
                        <p>加载申请列表失败</p>
                    </td>
                </tr>
            `);
        });
}

// 批准申请
function approveApplication(applicationId, button) {
    // 显示加载状态
    const btnGroup = $(button).closest('.btn-group');
    const originalContent = btnGroup.html();
    btnGroup.html(`
        <div class="loading-spinner">
            <i class="fa fa-spinner fa-spin"></i>
        </div>
    `);
    
    apiRequest(`/clubs/${clubId}/applications/${applicationId}/approve/`, 'POST', null, true)
        .then(function(response) {
            showMessage('成功批准申请', 'success');
            
            // 重新加载申请列表
            loadApplications();
        })
        .catch(function(error) {
            console.error('批准申请失败:', error);
            
            let errorMessage = '批准申请失败';
            if (error.response && error.response.data && error.response.data.detail) {
                errorMessage = error.response.data.detail;
            }
            
            showMessage(errorMessage, 'error');
            
            // 恢复按钮状态
            btnGroup.html(originalContent);
        });
}

// 拒绝申请
function rejectApplication(applicationId, button) {
    // 显示加载状态
    const btnGroup = $(button).closest('.btn-group');
    const originalContent = btnGroup.html();
    btnGroup.html(`
        <div class="loading-spinner">
            <i class="fa fa-spinner fa-spin"></i>
        </div>
    `);
    
    apiRequest(`/clubs/${clubId}/applications/${applicationId}/reject/`, 'POST', null, true)
        .then(function(response) {
            showMessage('已拒绝申请', 'info');
            
            // 重新加载申请列表
            loadApplications();
        })
        .catch(function(error) {
            console.error('拒绝申请失败:', error);
            
            let errorMessage = '拒绝申请失败';
            if (error.response && error.response.data && error.response.data.detail) {
                errorMessage = error.response.data.detail;
            }
            
            showMessage(errorMessage, 'error');
            
            // 恢复按钮状态
            btnGroup.html(originalContent);
        });
}

// 加载活动列表
function loadActivities() {
    const tableBody = $('#activities-table-body');
    tableBody.empty();
    
    // 显示加载状态
    tableBody.append(`
        <tr>
            <td colspan="6" class="text-center">
                <div class="loading-spinner">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">加载中...</span>
                    </div>
                    <p class="mt-3">正在加载活动列表...</p>
                </div>
            </td>
        </tr>
    `);
    
    apiRequest(`/clubs/${clubId}/activities/`, 'GET', null, false)
        .then(function(activities) {
            tableBody.empty();
            
            if (!activities || activities.length === 0) {
                tableBody.append(`
                    <tr>
                        <td colspan="6" class="text-center py-5">
                            <i class="fa fa-calendar-alt text-5xl text-muted mb-3"></i>
                            <p class="text-muted">暂无活动</p>
                            <button class="btn btn-primary mt-2" id="create-first-activity-btn">
                                <i class="fa fa-plus mr-2"></i>创建第一个活动
                            </button>
                        </td>
                    </tr>
                `);
                
                // 创建第一个活动按钮事件
                $('#create-first-activity-btn').on('click', function() {
                    window.location.href = `create-activity.html?club_id=${clubId}`;
                });
                
                return;
            }
            
            // 填充活动数据
            activities.forEach(function(activity) {
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
                
                const rowHTML = `
                    <tr>
                        <td>${activity.title}</td>
                        <td>${formatDate(activity.date, 'YYYY-MM-DD HH:mm')}</td>
                        <td>${activity.location}</td>
                        <td>${activity.participants ? activity.participants.length : 0}</td>
                        <td>
                            <span class="badge ${statusClass}">${statusText}</span>
                        </td>
                        <td>
                            <div class="btn-group">
                                <a href="activity-detail.html?id=${activity.id}" class="btn btn-outline-primary btn-sm">
                                    <i class="fa fa-eye mr-1"></i>查看
                                </a>
                                <a href="edit-activity.html?id=${activity.id}" class="btn btn-outline-warning btn-sm">
                                    <i class="fa fa-edit mr-1"></i>编辑
                                </a>
                                <button class="btn btn-outline-danger btn-sm" onclick="deleteActivity(${activity.id}, this)">
                                    <i class="fa fa-trash mr-1"></i>删除
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
                
                tableBody.append(rowHTML);
            });
        })
        .catch(function(error) {
            console.error('加载活动列表失败:', error);
            
            tableBody.empty();
            tableBody.append(`
                <tr>
                    <td colspan="6" class="text-center py-5">
                        <i class="fa fa-exclamation-circle text-5xl text-danger mb-3"></i>
                        <p>加载活动列表失败</p>
                    </td>
                </tr>
            `);
        });
}

// 删除活动
function deleteActivity(activityId, button) {
    // 确认删除
    if (!confirm('确定要删除该活动吗？此操作不可撤销。')) {
        return;
    }
    
    // 显示加载状态
    const btnGroup = $(button).closest('.btn-group');
    const originalContent = btnGroup.html();
    btnGroup.html(`
        <div class="loading-spinner">
            <i class="fa fa-spinner fa-spin"></i>
        </div>
    `);
    
    apiRequest(`/activities/${activityId}/`, 'DELETE', null, true)
        .then(function(response) {
            showMessage('成功删除活动', 'success');
            
            // 重新加载活动列表
            loadActivities();
        })
        .catch(function(error) {
            console.error('删除活动失败:', error);
            
            let errorMessage = '删除活动失败';
            if (error.response && error.response.data && error.response.data.detail) {
                errorMessage = error.response.data.detail;
            }
            
            showMessage(errorMessage, 'error');
            
            // 恢复按钮状态
            btnGroup.html(originalContent);
        });
}

// 加载社团设置
function loadSettings() {
    // 填充表单数据
    $('#club-name-input').val(currentClub.name);
    $('#club-description-input').val(currentClub.description);
    $('#club-category-input').val(currentClub.category);
    $('#club-email-input').val(currentClub.email || '');
    $('#club-phone-input').val(currentClub.phone || '');
    
    // 设置加入方式
    if (currentClub.join_method === 'open') {
        $('#open-join').prop('checked', true);
    } else {
        $('#approval-join').prop('checked', true);
    }
    
    // 隐藏提示消息
    $('#settings-message').removeClass('alert-info alert-success alert-danger').addClass('alert-info');
}

// 保存社团设置
function saveSettings() {
    // 收集表单数据
    const formData = {
        name: $('#club-name-input').val().trim(),
        description: $('#club-description-input').val().trim(),
        category: $('#club-category-input').val(),
        email: $('#club-email-input').val().trim(),
        phone: $('#club-phone-input').val().trim(),
        join_method: $('input[name="join_method"]:checked').val()
    };
    
    // 表单验证
    if (!formData.name) {
        showMessage('社团名称不能为空', 'error');
        return;
    }
    
    // 禁用提交按钮
    const submitBtn = $('#club-settings-form button[type="submit"]');
    const originalText = submitBtn.html();
    submitBtn.html('<i class="fa fa-spinner fa-spin mr-2"></i>保存中...');
    submitBtn.prop('disabled', true);
    
    apiRequest(`/clubs/${clubId}/`, 'PUT', formData, true)
        .then(function(updatedClub) {
            // 更新当前社团信息
            currentClub = updatedClub;
            
            // 更新页面标题和描述
            $('#club-name').text(updatedClub.name);
            $('#club-description').text(updatedClub.description);
            
            // 显示成功消息
            $('#settings-message').removeClass('alert-info alert-danger').addClass('alert-success');
            $('#settings-message').html('<i class="fa fa-check-circle mr-2"></i>设置已成功保存');
            
            showMessage('社团设置已成功更新', 'success');
        })
        .catch(function(error) {
            console.error('保存设置失败:', error);
            
            let errorMessage = '保存设置失败';
            if (error.response && error.response.data) {
                // 显示具体错误信息
                const errorDetails = Object.values(error.response.data).join('\n');
                errorMessage = errorDetails || '保存设置失败';
            }
            
            // 显示错误消息
            $('#settings-message').removeClass('alert-info alert-success').addClass('alert-danger');
            $('#settings-message').html(`<i class="fa fa-exclamation-circle mr-2"></i>${errorMessage}`);
            
            showMessage(errorMessage, 'error');
        })
        .finally(function() {
            // 恢复按钮状态
            submitBtn.html(originalText);
            submitBtn.prop('disabled', false);
        });
}