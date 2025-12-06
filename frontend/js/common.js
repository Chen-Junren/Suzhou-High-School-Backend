// 通用JavaScript脚本
// 包含多个页面共享的功能和工具函数

// API基础URL
const API_BASE_URL = 'http://localhost:8000/api';

// DOM加载完成后初始化
$(document).ready(function() {
    // 初始化导航栏
    updateNavbar();
    
    // 为所有页面添加基本功能
    setupPage();
    
    // 检查是否需要自动运行测试
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('run_test') === 'true') {
        loadTestScript();
    }
});

// 存储和获取Token
function getToken() {
    // 先尝试从带过期时间的存储中获取
    const token = getLocalStorageWithExpiry('auth_token');
    if (token) return token;
    
    // 兼容旧的token存储方式
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
}

// 存储和获取用户信息
function getUserInfo() {
    // 先尝试从带过期时间的存储中获取
    const user = getLocalStorageWithExpiry('user');
    if (user) return user;
    
    // 兼容旧的用户信息存储方式
    const userStr = localStorage.getItem('userInfo');
    return userStr ? JSON.parse(userStr) : null;
}

function setUserInfo(userInfo) {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
}

function removeUserInfo() {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('user');
}

// 检查用户是否已登录
function isLoggedIn() {
    return !!getToken();
}

// 获取当前登录用户信息
function getCurrentUser() {
    return getUserInfo();
}

// 保存当前登录用户信息
function saveCurrentUser(userData) {
    return setUserInfo(userData);
}

// 更新导航栏的登录状态
function updateNavbar() {
    if (isLoggedIn()) {
        $('#auth-nav').addClass('d-none');
        $('#user-nav').removeClass('d-none');
        const userInfo = getUserInfo();
        if (userInfo) {
            $('#username').text(userInfo.username);
        }
        
        // 兼容其他导航结构
        const userMenu = $('#user-menu');
        if (userMenu.length) {
            userMenu.html(`
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fa fa-user-circle mr-1"></i>${userInfo.username || userInfo.email}
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                        <li><a class="dropdown-item" href="profile.html"><i class="fa fa-user mr-1"></i>个人资料</a></li>
                        <li><a class="dropdown-item" href="clubs.html"><i class="fa fa-building mr-1"></i>我的社团</a></li>
                        <li><a class="dropdown-item" href="my-activities.html"><i class="fa fa-calendar-check mr-1"></i>我的活动</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick="logout()"><i class="fa fa-sign-out-alt mr-1"></i>退出登录</a></li>
                    </ul>
                </li>
            `);
        }
    } else {
        $('#auth-nav').removeClass('d-none');
        $('#user-nav').addClass('d-none');
        $('#username').text('');
        
        // 兼容其他导航结构
        const userMenu = $('#user-menu');
        if (userMenu.length) {
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
}

// 退出登录
function logout() {
    $.ajax({
        url: `${API_BASE_URL}/logout/`,
        type: 'POST',
        headers: {
            'Authorization': `Token ${getToken()}`,
            'Content-Type': 'application/json'
        },
        success: function(response) {
            removeToken();
            removeUserInfo();
            updateNavbar();
            showAlert('success', '退出登录成功');
            window.location.href = 'index.html';
        },
        error: function(xhr) {
            // 即使后端退出失败，前端也应该清除token
            removeToken();
            removeUserInfo();
            updateNavbar();
            window.location.href = 'index.html';
        }
    });
}

// 通用的API请求函数（基于jQuery AJAX）
function apiRequest(endpoint, method, data = null, requiresAuth = true) {
    return new Promise((resolve, reject) => {
        const options = {
            url: `${API_BASE_URL}${endpoint}`,
            type: method,
            dataType: 'json',
            success: resolve,
            error: function(xhr) {
                console.log('API请求失败，尝试使用模拟数据:', endpoint);
                
                // 检查是否有可用的模拟数据
                if (window.mockAPI) {
                    // 根据endpoint决定使用哪个mock方法
                    try {
                        // 处理登录请求
                        if ((endpoint === '/login/' || endpoint === '/api/login/') && method === 'POST') {
                            window.mockAPI.login(data).then(mockData => {
                                resolve(mockData);
                            }).catch(mockError => {
                                console.error('模拟数据获取失败:', mockError);
                                handleRealError(xhr);
                            });
                            return;
                        } else if (endpoint.includes('/clubs/') && endpoint.split('/').length > 3) {
                            // 获取社团详情
                            const clubId = endpoint.split('/').pop();
                            window.mockAPI.getClubDetails(clubId).then(mockData => {
                                resolve(mockData);
                            }).catch(mockError => {
                                console.error('模拟数据获取失败:', mockError);
                                handleRealError(xhr);
                            });
                            return;
                        } else if (endpoint.includes('/clubs')) {
                            // 获取社团列表
                            window.mockAPI.getFeaturedClubs().then(mockData => {
                                resolve(mockData);
                            }).catch(mockError => {
                                console.error('模拟数据获取失败:', mockError);
                                handleRealError(xhr);
                            });
                            return;
                        } else if (endpoint.includes('/activities/') && endpoint.split('/').length > 3) {
                            // 获取活动详情
                            const activityId = endpoint.split('/').pop();
                            window.mockAPI.getActivityDetails(activityId).then(mockData => {
                                resolve(mockData);
                            }).catch(mockError => {
                                console.error('模拟数据获取失败:', mockError);
                                handleRealError(xhr);
                            });
                            return;
                        } else if (endpoint.includes('/activities')) {
                            // 获取活动列表
                            window.mockAPI.getActivities().then(mockData => {
                                resolve(mockData);
                            }).catch(mockError => {
                                console.error('模拟数据获取失败:', mockError);
                                handleRealError(xhr);
                            });
                            return;
                        } else if (endpoint === '/auth/me' || endpoint === '/user/profile') {
                            // 获取当前用户信息
                            window.mockAPI.getCurrentUser().then(mockData => {
                                resolve(mockData);
                            }).catch(mockError => {
                                console.error('模拟数据获取失败:', mockError);
                                handleRealError(xhr);
                            });
                            return;
                        }
                    } catch (mockError) {
                        console.error('模拟数据获取失败:', mockError);
                    }
                }
                
                // 如果没有合适的模拟API，则尝试直接使用模拟数据
                if (window.mockData) {
                    if (endpoint.includes('/clubs') && !endpoint.includes('/clubs/')) {
                        resolve(window.mockData.clubs || []);
                        return;
                    } else if (endpoint.includes('/activities') && !endpoint.includes('/activities/')) {
                        resolve(window.mockData.activities || []);
                        return;
                    }
                }
                
                // 处理真实错误
                handleRealError(xhr);
            }
        };

        // 辅助函数：处理真实错误
        function handleRealError(xhr) {
            // 处理401未授权错误
            if (xhr.status === 401) {
                removeToken();
                removeUserInfo();
                updateNavbar();
                showAlert('error', '登录已过期，请重新登录');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            }
            reject(xhr);
        }

        // 设置请求头
        options.headers = {
            'Content-Type': 'application/json'
        };

        // 如果需要认证，添加Token
        if (requiresAuth) {
            const token = getToken();
            if (!token) {
                reject(new Error('未登录或登录已过期'));
                return;
            }
            options.headers['Authorization'] = `Token ${token}`;
        }

        // 添加数据（如果有）
        if (data && method !== 'GET') {
            options.data = JSON.stringify(data);
        }

        $.ajax(options);
    });
}

// 通用的文件上传函数
function uploadFile(endpoint, formData, requiresAuth = true) {
    return new Promise((resolve, reject) => {
        const options = {
            url: `${API_BASE_URL}${endpoint}`,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: resolve,
            error: function(xhr) {
                // 处理401未授权错误
                if (xhr.status === 401) {
                    removeToken();
                    removeUserInfo();
                    updateNavbar();
                    showAlert('error', '登录已过期，请重新登录');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);
                }
                reject(xhr);
            }
        };

        // 如果需要认证，添加Token
        if (requiresAuth) {
            const token = getToken();
            if (!token) {
                reject(new Error('未登录或登录已过期'));
                return;
            }
            options.headers = options.headers || {};
            options.headers['Authorization'] = `Token ${token}`;
        }

        $.ajax(options);
    });
}

// 显示提示信息
function showAlert(type, message, duration = 3000) {
    // 移除现有的提示
    $('.alert-fixed').remove();
    $('.message-alert').remove();

    // 创建新的提示
    const alertType = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';

    const icon = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    }[type] || 'fa-info-circle';

    const alert = $(`
        <div class="alert ${alertType} alert-fixed alert-dismissible fade show fixed-top m-4" role="alert">
            <i class="fa ${icon} mr-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `);

    // 添加到body
    $('body').append(alert);

    // 自动关闭
    setTimeout(() => {
        alert.alert('close');
    }, duration);
}

// 为其他模块提供兼容的showMessage函数
function showMessage(message, type = 'info', duration = 3000) {
    showAlert(type, message, duration);
}

// 设置页面基本功能
function setupPage() {
    // 为所有表单添加基本验证
    setupFormValidation();
    
    // 添加响应式处理
    setupResponsiveBehavior();
    
    // 设置加载状态处理
    setupLoadingState();
    
    // 为所有页面添加错误边界处理
    setupErrorBoundary();
    
    // 初始化图片懒加载
    initLazyLoading();
}

// 设置表单验证
function setupFormValidation() {
    // 为所有required字段添加基本验证
    $('form').on('submit', function(e) {
        let isValid = true;
        const form = $(this);
        
        // 检查所有必填字段
        form.find('[required]').each(function() {
            const field = $(this);
            if (!field.val() || field.val().trim() === '') {
                isValid = false;
                field.addClass('is-invalid');
                
                // 添加错误提示
                if (!field.next('.invalid-feedback').length) {
                    field.after('<div class="invalid-feedback">此字段为必填项</div>');
                }
            }
        });
        
        // 如果有验证错误，阻止表单提交
        if (!isValid) {
            e.preventDefault();
            showAlert('error', '请填写所有必填字段');
        }
    });
    
    // 当用户开始输入时，清除验证错误状态
    $('[required]').on('input', function() {
        $(this).removeClass('is-invalid');
    });
}

// 设置响应式行为
function setupResponsiveBehavior() {
    // 处理窗口大小变化
    $(window).on('resize', function() {
        adjustLayout();
    });
    
    // 初始调整
    adjustLayout();
}

// 调整布局以适应窗口大小
function adjustLayout() {
    const windowWidth = $(window).width();
    
    // 可以在这里添加针对不同屏幕尺寸的布局调整
    if (windowWidth < 768) {
        // 移动端布局调整
    } else {
        // 桌面端布局调整
    }
}

// 设置加载状态处理
function setupLoadingState() {
    // 添加全局加载指示器
    if (!$('#global-loading').length) {
        const loadingHtml = `
            <div id="global-loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style="display: none;">
                <div class="bg-white p-4 rounded-lg shadow-lg">
                    <div class="spinner-border text-primary" role="status">
                        <span class="sr-only">加载中...</span>
                    </div>
                    <p class="mt-2">处理中，请稍候...</p>
                </div>
            </div>
        `;
        $('body').append(loadingHtml);
    }
}

// 显示全局加载指示器
function showLoading() {
    $('#global-loading').show();
}

// 隐藏全局加载指示器
function hideLoading() {
    $('#global-loading').hide();
}

// 设置全局错误边界处理
function setupErrorBoundary() {
    // 监听未捕获的JavaScript错误
    window.addEventListener('error', function(error) {
        console.error('全局错误捕获:', error);
        // 可以添加错误上报逻辑
    });
    
    // 监听Promise未捕获的拒绝
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Promise拒绝捕获:', event.reason);
        // 可以添加错误上报逻辑
    });
}

// 加载测试脚本
function loadTestScript() {
    // 创建测试脚本元素
    const script = document.createElement('script');
    script.src = 'test/functionality-test.js';
    script.onload = function() {
        console.log('测试脚本加载完成');
    };
    script.onerror = function() {
        console.error('测试脚本加载失败');
    };
    
    // 添加到页面
    document.head.appendChild(script);
}

// 图片懒加载初始化
function initLazyLoading() {
    // 检查浏览器是否支持Intersection Observer API
    if ('IntersectionObserver' in window) {
        const imgObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const dataSrc = img.getAttribute('data-src');
                    
                    if (dataSrc) {
                        img.src = dataSrc;
                        img.removeAttribute('data-src');
                        img.classList.add('img-loaded');
                    }
                    
                    observer.unobserve(img);
                }
            });
        });
        
        // 对所有带有data-src属性的图片应用懒加载
        document.querySelectorAll('img[data-src]').forEach(img => {
            imgObserver.observe(img);
        });
    } else {
        // 降级处理：如果浏览器不支持Intersection Observer，直接加载所有图片
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
            img.classList.add('img-loaded');
        });
    }
}

// 生成随机ID
function generateId() {
    return '_' + Math.random().toString(36).substring(2, 9);
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 验证邮箱格式
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 验证密码强度
function checkPasswordStrength(password) {
    let strength = 0;
    let suggestions = [];
    
    // 长度检查
    if (password.length >= 8) {
        strength += 1;
    } else {
        suggestions.push('密码长度至少为8个字符');
    }
    
    // 包含小写字母
    if (/[a-z]/.test(password)) {
        strength += 1;
    } else {
        suggestions.push('包含至少一个小写字母');
    }
    
    // 包含大写字母
    if (/[A-Z]/.test(password)) {
        strength += 1;
    } else {
        suggestions.push('包含至少一个大写字母');
    }
    
    // 包含数字
    if (/[0-9]/.test(password)) {
        strength += 1;
    } else {
        suggestions.push('包含至少一个数字');
    }
    
    // 包含特殊字符
    if (/[^A-Za-z0-9]/.test(password)) {
        strength += 1;
    } else {
        suggestions.push('包含至少一个特殊字符');
    }
    
    return {
        strength: strength,
        level: getStrengthLevel(strength),
        suggestions: suggestions
    };
}

// 获取密码强度等级
function getStrengthLevel(strength) {
    if (strength <= 2) return '弱';
    if (strength <= 4) return '中';
    return '强';
}

// 格式化日期为本地字符串（扩展版本）
function formatDate(dateString, options = {showTime: true}) {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
        return '无效日期';
    }
    
    if (!options.showTime) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 显示确认对话框
function showConfirmation(message, callback) {
    if (confirm(message)) {
        if (typeof callback === 'function') {
            callback(true);
        }
    } else if (typeof callback === 'function') {
        callback(false);
    }
}

// 设置带过期时间的localStorage
function setLocalStorageWithExpiry(key, value, ttl) {
    const now = new Date();
    // 创建一个对象，包含值和过期时间
    const item = {
        value: value,
        expiry: now.getTime() + ttl,
    };
    // 存储字符串化的对象
    localStorage.setItem(key, JSON.stringify(item));
}

// 获取带过期时间的localStorage项
function getLocalStorageWithExpiry(key) {
    const itemStr = localStorage.getItem(key);
    
    // 如果项不存在，则返回null
    if (!itemStr) {
        return null;
    }
    
    const item = JSON.parse(itemStr);
    const now = new Date();
    
    // 如果过期，则移除该项并返回null
    if (now.getTime() > item.expiry) {
        localStorage.removeItem(key);
        return null;
    }
    
    return item.value;
}

// 页面加载时更新导航栏并保护受限制页面
$(document).ready(function() {
    updateNavbar();

    // 阻止未登录用户访问需要认证的页面
    const protectedPages = ['profile.html', 'my-clubs.html', 'create-club.html', 'clubs.html', 'create-activity.html'];
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop();

    if (protectedPages.includes(currentPage) && !isLoggedIn()) {
        showAlert('error', '请先登录');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    }
});