// 前端功能测试脚本
// 此脚本用于测试和验证前端功能的完整性

/**
 * 测试导航栏功能
 */
function testNavbar() {
    console.log('========== 测试导航栏功能 ==========');
    
    // 检查导航栏是否存在
    const navbar = document.getElementById('main-navbar');
    if (!navbar) {
        console.error('❌ 导航栏不存在');
        return false;
    }
    console.log('✅ 导航栏存在');
    
    // 检查导航项是否完整
    const navLinks = navbar.querySelectorAll('.nav-link');
    console.log(`✅ 导航栏包含 ${navLinks.length} 个导航项`);
    
    // 检查品牌链接
    const brandLink = navbar.querySelector('.navbar-brand');
    if (brandLink && brandLink.getAttribute('href') === 'index.html') {
        console.log('✅ 品牌链接指向正确的首页');
    } else {
        console.error('❌ 品牌链接配置不正确');
    }
    
    console.log('----------------------------------');
    return true;
}

/**
 * 测试表单验证功能
 */
function testFormValidation(formId) {
    console.log(`========== 测试表单验证: ${formId} ==========`);
    
    const form = document.getElementById(formId);
    if (!form) {
        console.error(`❌ 表单 ${formId} 不存在`);
        return false;
    }
    
    // 检查必填字段
    const requiredFields = form.querySelectorAll('[required]');
    console.log(`✅ 表单包含 ${requiredFields.length} 个必填字段`);
    
    // 检查表单提交事件处理
    const hasSubmitHandler = form.hasAttribute('onsubmit') || 
                           form.getAttribute('onSubmit') !== null ||
                           // 检查是否有jQuery事件绑定
                           typeof $ !== 'undefined' && 
                           $(form).data('events') && 
                           $(form).data('events').submit;
    
    if (hasSubmitHandler) {
        console.log('✅ 表单已配置提交事件处理');
    } else {
        console.warn('⚠️ 表单可能没有配置提交事件处理');
    }
    
    console.log('----------------------------------');
    return true;
}

/**
 * 测试API调用功能
 */
function testApiCalls() {
    console.log('========== 测试API调用功能 ==========');
    
    // 检查API_BASE_URL是否定义
    if (typeof API_BASE_URL === 'undefined') {
        console.error('❌ API_BASE_URL 未定义');
        return false;
    }
    console.log(`✅ API基础URL: ${API_BASE_URL}`);
    
    // 检查本地存储中的用户信息
    const userJson = localStorage.getItem('user');
    if (userJson) {
        try {
            const user = JSON.parse(userJson);
            console.log(`✅ 用户已登录: ${user.username || user.email}`);
        } catch (e) {
            console.error('❌ 用户信息格式不正确');
        }
    } else {
        console.log('✅ 用户未登录');
    }
    
    console.log('----------------------------------');
    return true;
}

/**
 * 测试响应式设计
 */
function testResponsiveDesign() {
    console.log('========== 测试响应式设计 ==========');
    
    // 检查视口元标签
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
        console.log(`✅ 视口元标签已设置: ${viewportMeta.getAttribute('content')}`);
    } else {
        console.error('❌ 缺少视口元标签');
    }
    
    // 检查Bootstrap类
    const bootstrapClasses = ['container', 'row', 'col', 'navbar-expand', 'card'];
    let bootstrapDetected = false;
    
    for (const className of bootstrapClasses) {
        if (document.querySelector(`.${className}`)) {
            bootstrapDetected = true;
            break;
        }
    }
    
    if (bootstrapDetected) {
        console.log('✅ 检测到Bootstrap响应式类');
    } else {
        console.warn('⚠️ 未检测到Bootstrap响应式类');
    }
    
    console.log('----------------------------------');
    return true;
}

/**
 * 测试错误处理
 */
function testErrorHandling() {
    console.log('========== 测试错误处理 ==========');
    
    // 检查错误提示容器
    const errorContainers = document.querySelectorAll('.alert-danger, #error-container');
    if (errorContainers.length > 0) {
        console.log(`✅ 页面包含 ${errorContainers.length} 个错误提示容器`);
    } else {
        console.warn('⚠️ 页面可能缺少错误提示容器');
    }
    
    // 检查错误处理函数是否定义
    const hasErrorHandlers = typeof showError !== 'undefined' || 
                           typeof handleError !== 'undefined';
    
    if (hasErrorHandlers) {
        console.log('✅ 检测到错误处理函数');
    } else {
        console.warn('⚠️ 未检测到错误处理函数');
    }
    
    console.log('----------------------------------');
    return true;
}

/**
 * 测试页面特定功能
 */
function testPageSpecificFeatures() {
    console.log('========== 测试页面特定功能 ==========');
    
    // 根据当前页面URL执行特定测试
    const currentPage = window.location.pathname.split('/').pop();
    
    switch (currentPage) {
        case 'login.html':
            testLoginPage();
            break;
        case 'register.html':
            testRegisterPage();
            break;
        case 'profile.html':
            testProfilePage();
            break;
        case 'clubs.html':
            testClubsPage();
            break;
        case 'club-detail.html':
            testClubDetailPage();
            break;
        case 'activity-detail.html':
            testActivityDetailPage();
            break;
        case 'create-activity.html':
        case 'edit-activity.html':
            testActivityFormPage();
            break;
        case 'manage-club.html':
            testManageClubPage();
            break;
        default:
            console.log(`⚠️ 没有针对页面 ${currentPage} 的特定测试`);
    }
    
    console.log('----------------------------------');
}

/**
 * 测试登录页面
 */
function testLoginPage() {
    console.log('🔍 测试登录页面功能');
    
    // 检查登录表单
    testFormValidation('login-form');
    
    // 检查是否有记住我选项
    const rememberMe = document.getElementById('remember-me');
    if (rememberMe) {
        console.log('✅ 检测到记住我选项');
    }
    
    // 检查注册链接
    const registerLink = document.querySelector('a[href="register.html"]');
    if (registerLink) {
        console.log('✅ 检测到注册链接');
    }
}

/**
 * 测试注册页面
 */
function testRegisterPage() {
    console.log('🔍 测试注册页面功能');
    
    // 检查注册表单
    testFormValidation('register-form');
    
    // 检查密码强度指示器
    const passwordStrength = document.getElementById('password-strength');
    if (passwordStrength) {
        console.log('✅ 检测到密码强度指示器');
    }
    
    // 检查确认密码字段
    const confirmPassword = document.getElementById('confirm-password');
    if (confirmPassword) {
        console.log('✅ 检测到确认密码字段');
    }
}

/**
 * 测试个人资料页面
 */
function testProfilePage() {
    console.log('🔍 测试个人资料页面功能');
    
    // 检查资料表单
    testFormValidation('profile-form');
    
    // 检查我的社团部分
    const myClubsSection = document.querySelector('#my-clubs');
    if (myClubsSection) {
        console.log('✅ 检测到我的社团部分');
    }
}

/**
 * 测试社团列表页面
 */
function testClubsPage() {
    console.log('🔍 测试社团列表页面功能');
    
    // 检查搜索框
    const searchInput = document.getElementById('search-clubs');
    if (searchInput) {
        console.log('✅ 检测到社团搜索框');
    }
    
    // 检查社团卡片容器
    const clubCardsContainer = document.querySelector('#clubs-container');
    if (clubCardsContainer) {
        console.log('✅ 检测到社团卡片容器');
    }
}

/**
 * 测试社团详情页面
 */
function testClubDetailPage() {
    console.log('🔍 测试社团详情页面功能');
    
    // 检查社团信息区
    const clubInfo = document.querySelector('.club-info');
    if (clubInfo) {
        console.log('✅ 检测到社团信息区');
    }
    
    // 检查成员列表和活动信息选项卡
    const tabs = document.querySelectorAll('.nav-tabs .nav-item');
    if (tabs.length >= 2) {
        console.log(`✅ 检测到 ${tabs.length} 个选项卡`);
    }
}

/**
 * 测试活动详情页面
 */
function testActivityDetailPage() {
    console.log('🔍 测试活动详情页面功能');
    
    // 检查活动信息区
    const activityInfo = document.querySelector('.activity-info');
    if (activityInfo) {
        console.log('✅ 检测到活动信息区');
    }
    
    // 检查参与者列表和评论区
    const participantsList = document.querySelector('#participants-list');
    const commentsSection = document.querySelector('#comments-section');
    
    if (participantsList) console.log('✅ 检测到参与者列表');
    if (commentsSection) console.log('✅ 检测到评论区');
}

/**
 * 测试活动表单页面（创建和编辑）
 */
function testActivityFormPage() {
    console.log('🔍 测试活动表单页面功能');
    
    // 检查活动表单
    const formId = document.getElementById('create-activity-form') ? 'create-activity-form' : 'edit-activity-form';
    testFormValidation(formId);
    
    // 检查日期和时间字段
    const dateField = document.getElementById('activity-date');
    const timeField = document.getElementById('activity-time');
    
    if (dateField && timeField) {
        console.log('✅ 检测到日期和时间字段');
    }
    
    // 检查图片上传功能
    const imageUpload = document.getElementById('activity-image');
    if (imageUpload) {
        console.log('✅ 检测到图片上传功能');
    }
}

/**
 * 测试社团管理页面
 */
function testManageClubPage() {
    console.log('🔍 测试社团管理页面功能');
    
    // 检查侧边栏导航
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        console.log('✅ 检测到管理侧边栏');
    }
    
    // 检查各个管理选项卡
    const memberManagement = document.querySelector('#member-management');
    const applicationManagement = document.querySelector('#application-management');
    const activityManagement = document.querySelector('#activity-management');
    const clubSettings = document.querySelector('#club-settings');
    
    if (memberManagement) console.log('✅ 检测到成员管理选项卡');
    if (applicationManagement) console.log('✅ 检测到申请管理选项卡');
    if (activityManagement) console.log('✅ 检测到活动管理选项卡');
    if (clubSettings) console.log('✅ 检测到社团设置选项卡');
}

/**
 * 运行所有测试
 */
function runAllTests() {
    console.log('==================================');
    console.log('开始前端功能测试...');
    console.log('==================================');
    
    let allTestsPassed = true;
    
    try {
        // 运行基本测试
        testNavbar();
        testResponsiveDesign();
        testErrorHandling();
        
        // 运行表单测试
        const formIds = ['login-form', 'register-form', 'profile-form', 'create-activity-form', 'edit-activity-form', 'manage-club-form'];
        for (const formId of formIds) {
            if (document.getElementById(formId)) {
                testFormValidation(formId);
            }
        }
        
        // 运行API调用测试
        testApiCalls();
        
        // 运行页面特定测试
        testPageSpecificFeatures();
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
        allTestsPassed = false;
    }
    
    console.log('==================================');
    if (allTestsPassed) {
        console.log('✅ 所有测试已完成');
    } else {
        console.log('❌ 部分测试失败');
    }
    console.log('==================================');
}

// 页面加载完成后运行测试
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    // 如果DOM已经加载完成，立即运行测试
    runAllTests();
}