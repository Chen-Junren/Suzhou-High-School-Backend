// 登录页面脚本

$(document).ready(function() {
    // 检查用户是否已登录，如果已登录则跳转到首页
    if (isLoggedIn()) {
        window.location.href = 'index.html';
    }

    // 初始化导航栏状态
    updateNavbar();

    // 登录表单提交事件
    $('#login-form').on('submit', function(event) {
        event.preventDefault();
        
        // 清除之前的错误信息
        clearErrors();
        
        // 获取表单数据
        const username = $('#username').val().trim();
        const password = $('#password').val().trim();
        const rememberMe = $('#remember-me').is(':checked');
        
        // 简单的客户端验证
        let isValid = true;
        
        if (!username) {
            showError('username', '请输入用户名');
            isValid = false;
        }
        
        if (!password) {
            showError('password', '请输入密码');
            isValid = false;
        }
        
        if (!isValid) {
            return;
        }
        
        // 提交登录请求
        const loginData = {
            username: username,
            password: password
        };
        
        // 显示加载状态
        const submitButton = $(this).find('button[type="submit"]');
        const originalText = submitButton.html();
        submitButton.html('<i class="fa fa-spinner fa-spin mr-1"></i>登录中...');
        submitButton.prop('disabled', true);
        
        apiRequest('/login/', 'POST', loginData, false)
            .then(function(response) {
                // 保存token和用户信息
                if (response.token && response.user) {
                    // 根据是否记住我设置过期时间
                    if (rememberMe) {
                        // 记住我，设置7天过期
                        setLocalStorageWithExpiry('auth_token', response.token, 7 * 24 * 60 * 60 * 1000);
                        setLocalStorageWithExpiry('user', response.user, 7 * 24 * 60 * 60 * 1000);
                    } else {
                        // 不记住我，会话结束时过期
                        localStorage.setItem('auth_token', response.token);
                        localStorage.setItem('user', JSON.stringify(response.user));
                    }
                    
                    // 显示成功消息并跳转
                    showMessage('登录成功，正在跳转...', 'success');
                    setTimeout(function() {
                        // 检查URL是否有next参数，如果有则跳转到该页面，否则跳转到首页
                        const nextUrl = getUrlParam('next');
                        window.location.href = nextUrl || 'index.html';
                    }, 1500);
                } else {
                    showMessage('登录失败：服务器返回数据格式错误', 'error');
                }
            })
            .catch(function(error) {
                console.error('登录失败:', error);
                
                // 处理不同类型的错误
                if (error.response && error.response.status === 400) {
                    // 处理400错误（用户名或密码错误）
                    showMessage('用户名或密码错误', 'error');
                } else if (error.response && error.response.status === 401) {
                    showMessage('认证失败，请检查凭据', 'error');
                } else if (error.response && error.response.data) {
                    // 显示服务器返回的具体错误
                    if (error.response.data.non_field_errors) {
                        showMessage(error.response.data.non_field_errors[0], 'error');
                    } else {
                        // 显示字段特定的错误
                        for (const field in error.response.data) {
                            if (error.response.data.hasOwnProperty(field)) {
                                if (field === 'username' || field === 'password') {
                                    showError(field, error.response.data[field][0]);
                                } else {
                                    showMessage(error.response.data[field][0], 'error');
                                }
                            }
                        }
                    }
                } else {
                    showMessage('登录失败：网络错误，请稍后再试', 'error');
                }
            })
            .finally(function() {
                // 恢复按钮状态
                submitButton.html(originalText);
                submitButton.prop('disabled', false);
            });
    });
});

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