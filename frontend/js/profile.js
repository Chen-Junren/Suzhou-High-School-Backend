// 个人资料页面脚本

$(document).ready(function() {
    // 检查用户是否已登录，如果未登录则跳转到登录页
    if (!isLoggedIn()) {
        window.location.href = 'login.html?next=profile.html';
    }

    // 初始化导航栏状态
    updateNavbar();

    // 加载用户个人信息
    loadUserProfile();

    // 加载用户加入的社团列表
    loadUserClubs();

    // 个人资料表单提交事件
    $('#profile-form').on('submit', function(event) {
        event.preventDefault();
        
        // 清除之前的错误信息
        clearErrors();
        
        // 获取表单数据
        const username = $('#edit-username').val().trim();
        const email = $('#edit-email').val().trim();
        const password = $('#edit-password').val().trim();
        const password2 = $('#edit-password2').val().trim();
        const currentPassword = $('#current-password').val().trim();
        
        // 客户端验证
        let isValid = true;
        
        // 验证用户名
        if (!username) {
            showError('edit-username', '请输入用户名');
            isValid = false;
        } else if (username.length < 3 || username.length > 30) {
            showError('edit-username', '用户名长度应在3-30个字符之间');
            isValid = false;
        }
        
        // 验证邮箱
        if (!email) {
            showError('edit-email', '请输入邮箱');
            isValid = false;
        } else if (!isValidEmail(email)) {
            showError('edit-email', '请输入有效的邮箱地址');
            isValid = false;
        }
        
        // 如果要修改密码，进行验证
        if (password) {
            if (password.length < 8) {
                showError('edit-password', '密码长度至少为8个字符');
                isValid = false;
            } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
                showError('edit-password', '密码必须包含字母和数字');
                isValid = false;
            }
            
            if (!password2) {
                showError('edit-password2', '请确认新密码');
                isValid = false;
            } else if (password !== password2) {
                showError('edit-password2', '两次输入的新密码不一致');
                isValid = false;
            }
        }
        
        // 验证当前密码
        if (!currentPassword) {
            showError('current-password', '请输入当前密码');
            isValid = false;
        }
        
        if (!isValid) {
            return;
        }
        
        // 构建更新数据
        const updateData = {
            username: username,
            email: email,
            current_password: currentPassword
        };
        
        // 如果提供了新密码，则添加到数据中
        if (password) {
            updateData.password = password;
            updateData.password2 = password2;
        }
        
        // 显示加载状态
        const submitButton = $(this).find('button[type="submit"]');
        const originalText = submitButton.html();
        submitButton.html('<i class="fa fa-spinner fa-spin mr-1"></i>保存中...');
        submitButton.prop('disabled', true);
        
        apiRequest('/profile/', 'PUT', updateData, true)
            .then(function(response) {
                // 更新成功，显示成功消息
                showMessage('个人资料更新成功', 'success');
                
                // 更新本地存储的用户信息
                const user = getUser();
                user.username = response.username || user.username;
                user.email = response.email || user.email;
                localStorage.setItem('user', JSON.stringify(user));
                
                // 更新页面显示的用户信息
                updateUserDisplay(response);
                
                // 重置表单中的密码字段
                $('#edit-password').val('');
                $('#edit-password2').val('');
                $('#current-password').val('');
            })
            .catch(function(error) {
                console.error('更新个人资料失败:', error);
                
                // 处理不同类型的错误
                if (error.response && error.response.status === 400) {
                    // 显示字段特定的错误
                    if (error.response.data) {
                        for (const field in error.response.data) {
                            if (error.response.data.hasOwnProperty(field)) {
                                const errorField = field === 'current_password' ? 'current-password' : 
                                                field === 'password' ? 'edit-password' : 
                                                field === 'password2' ? 'edit-password2' : 
                                                field === 'username' ? 'edit-username' : 
                                                field === 'email' ? 'edit-email' : field;
                                
                                if ($('#' + errorField).length) {
                                    showError(errorField, error.response.data[field][0]);
                                } else {
                                    showMessage(error.response.data[field][0], 'error');
                                }
                            }
                        }
                    } else {
                        showMessage('更新失败：请检查输入信息', 'error');
                    }
                } else if (error.response && error.response.status === 401) {
                    showMessage('认证失败，请重新登录', 'error');
                    setTimeout(function() {
                        logout();
                    }, 1500);
                } else {
                    showMessage('更新失败：网络错误，请稍后再试', 'error');
                }
            })
            .finally(function() {
                // 恢复按钮状态
                submitButton.html(originalText);
                submitButton.prop('disabled', false);
            });
    });
});

// 加载用户个人信息
function loadUserProfile() {
    apiRequest('/profile/', 'GET', null, true)
        .then(function(response) {
            updateUserDisplay(response);
        })
        .catch(function(error) {
            console.error('加载用户信息失败:', error);
            if (error.response && error.response.status === 401) {
                showMessage('认证失败，请重新登录', 'error');
                setTimeout(function() {
                    logout();
                }, 1500);
            }
        });
}

// 更新用户信息显示
function updateUserDisplay(userData) {
    // 更新表单字段
    $('#edit-username').val(userData.username);
    $('#edit-email').val(userData.email);
    
    // 更新显示区域
    $('#profile-username').text(userData.username);
    $('#profile-email').text(userData.email);
    
    // 更新头像（使用用户名首字母）
    const firstLetter = userData.username.charAt(0).toUpperCase();
    $('#user-avatar').html(`<span>${firstLetter}</span>`);
    
    // 更新注册日期
    if (userData.created_at) {
        $('#profile-join-date').text('注册时间: ' + formatDate(userData.created_at));
    }
}

// 加载用户加入的社团列表
function loadUserClubs() {
    apiRequest('/clubs/my-clubs/', 'GET', null, true)
        .then(function(response) {
            const clubsContainer = $('#my-clubs-container');
            const noClubsMessage = $('#no-clubs-message');
            
            clubsContainer.empty();
            
            if (response.length > 0) {
                // 隐藏无社团消息
                noClubsMessage.hide();
                
                // 添加社团卡片
                response.forEach(function(club) {
                    const clubCard = `
                        <div class="col-md-6 mb-4">
                            <div class="card h-100">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <h5 class="card-title mb-0">${club.name}</h5>
                                        <span class="badge bg-primary">${club.category}</span>
                                    </div>
                                    <p class="card-text text-truncate">${club.description}</p>
                                    <div class="mt-2 text-muted">
                                        <small><i class="fa fa-user-circle mr-1"></i>${club.leader.username}</small>
                                        <small class="ml-3"><i class="fa fa-users mr-1"></i>${club.members.length} 成员</small>
                                    </div>
                                    <div class="mt-3">
                                        <a href="club-detail.html?id=${club.id}" class="btn btn-outline-primary btn-sm mr-2">查看详情</a>
                                        ${club.leader.id === getUser().id ? `<a href="manage-club.html?id=${club.id}" class="btn btn-primary btn-sm">管理社团</a>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    clubsContainer.append(clubCard);
                });
            } else {
                // 显示无社团消息
                clubsContainer.append(noClubsMessage);
                noClubsMessage.show();
            }
        })
        .catch(function(error) {
            console.error('加载用户社团失败:', error);
        });
}

// 验证邮箱格式
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 显示字段错误
function showError(fieldId, message) {
    const field = $('#' + fieldId);
    field.addClass('is-invalid');
    const errorElement = field.siblings('.invalid-feedback');
    errorElement.text(message);
}

// 清除所有错误信息
function clearErrors() {
    $('.form-control').removeClass('is-invalid');
    $('.invalid-feedback').text('');
}

// 切换密码可见性
function togglePasswordVisibility(fieldId) {
    const field = $('#' + fieldId);
    const icon = field.siblings('.password-toggle').find('i');
    
    if (field.attr('type') === 'password') {
        field.attr('type', 'text');
        icon.removeClass('fa-eye-slash').addClass('fa-eye');
    } else {
        field.attr('type', 'password');
        icon.removeClass('fa-eye').addClass('fa-eye-slash');
    }
}