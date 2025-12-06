// 注册页面脚本

$(document).ready(function() {
    // 检查用户是否已登录，如果已登录则跳转到首页
    if (isLoggedIn()) {
        window.location.href = 'index.html';
    }

    // 初始化导航栏状态
    updateNavbar();

    // 密码强度检查
    $('#password').on('input', function() {
        checkPasswordStrength($(this).val());
    });

    // 注册表单提交事件
    $('#register-form').on('submit', function(event) {
        event.preventDefault();
        
        // 清除之前的错误信息
        clearErrors();
        
        // 获取表单数据
        const username = $('#username').val().trim();
        const email = $('#email').val().trim();
        const password = $('#password').val().trim();
        const password2 = $('#password2').val().trim();
        const agreeTerms = $('#agree-terms').is(':checked');
        
        // 客户端验证
        let isValid = true;
        
        // 验证用户名
        if (!username) {
            showError('username', '请输入用户名');
            isValid = false;
        } else if (username.length < 3 || username.length > 30) {
            showError('username', '用户名长度应在3-30个字符之间');
            isValid = false;
        }
        
        // 验证邮箱
        if (!email) {
            showError('email', '请输入邮箱');
            isValid = false;
        } else if (!isValidEmail(email)) {
            showError('email', '请输入有效的邮箱地址');
            isValid = false;
        }
        
        // 验证密码
        if (!password) {
            showError('password', '请输入密码');
            isValid = false;
        } else if (password.length < 8) {
            showError('password', '密码长度至少为8个字符');
            isValid = false;
        } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
            showError('password', '密码必须包含字母和数字');
            isValid = false;
        }
        
        // 验证确认密码
        if (!password2) {
            showError('password2', '请确认密码');
            isValid = false;
        } else if (password !== password2) {
            showError('password2', '两次输入的密码不一致');
            isValid = false;
        }
        
        // 验证服务条款
        if (!agreeTerms) {
            showMessage('请阅读并同意服务条款和隐私政策', 'error');
            isValid = false;
        }
        
        if (!isValid) {
            return;
        }
        
        // 提交注册请求
        const registerData = {
            username: username,
            email: email,
            password: password,
            password2: password2
        };
        
        // 显示加载状态
        const submitButton = $(this).find('button[type="submit"]');
        const originalText = submitButton.html();
        submitButton.html('<i class="fa fa-spinner fa-spin mr-1"></i>注册中...');
        submitButton.prop('disabled', true);
        
        apiRequest('/register/', 'POST', registerData, false)
            .then(function(response) {
                // 注册成功，显示成功消息并跳转到登录页
                showMessage('注册成功，请登录', 'success');
                setTimeout(function() {
                    window.location.href = 'login.html';
                }, 2000);
            })
            .catch(function(error) {
                console.error('注册失败:', error);
                
                // 处理不同类型的错误
                if (error.response && error.response.status === 400) {
                    // 显示字段特定的错误
                    if (error.response.data) {
                        for (const field in error.response.data) {
                            if (error.response.data.hasOwnProperty(field)) {
                                if (['username', 'email', 'password', 'password2'].includes(field)) {
                                    showError(field, error.response.data[field][0]);
                                } else {
                                    showMessage(error.response.data[field][0], 'error');
                                }
                            }
                        }
                    } else {
                        showMessage('注册失败：请检查输入信息', 'error');
                    }
                } else {
                    showMessage('注册失败：网络错误，请稍后再试', 'error');
                }
            })
            .finally(function() {
                // 恢复按钮状态
                submitButton.html(originalText);
                submitButton.prop('disabled', false);
            });
    });
});

// 检查密码强度
function checkPasswordStrength(password) {
    const strengthIndicator = $('#password-strength');
    
    if (!password) {
        strengthIndicator.width('0%');
        strengthIndicator.removeClass('bg-danger bg-warning bg-info bg-success');
        return;
    }
    
    let strength = 0;
    
    // 长度检查
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // 包含数字
    if (/\d/.test(password)) strength += 1;
    
    // 包含小写字母
    if (/[a-z]/.test(password)) strength += 1;
    
    // 包含大写字母
    if (/[A-Z]/.test(password)) strength += 1;
    
    // 包含特殊字符
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // 更新强度指示器
    const percentage = (strength / 6) * 100;
    strengthIndicator.width(percentage + '%');
    
    // 设置颜色
    strengthIndicator.removeClass('bg-danger bg-warning bg-info bg-success');
    if (percentage < 30) {
        strengthIndicator.addClass('bg-danger');
    } else if (percentage < 60) {
        strengthIndicator.addClass('bg-warning');
    } else if (percentage < 90) {
        strengthIndicator.addClass('bg-info');
    } else {
        strengthIndicator.addClass('bg-success');
    }
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