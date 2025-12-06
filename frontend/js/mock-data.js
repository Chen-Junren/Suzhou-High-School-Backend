// 模拟数据文件 - 用于在没有后端API的情况下展示页面内容
const mockData = {
  // 用户数据
  currentUser: {
    id: '1',
    username: 'student1',
    email: 'student1@example.com',
    role: 'user',
    avatar: 'https://via.placeholder.com/40'
  },
  
  // 社团列表数据
  clubs: [
    {
      id: '1',
      name: '编程协会',
      description: '专注于编程技术交流与学习的社团',
      coverImage: 'https://via.placeholder.com/800x400?text=编程协会',
      memberCount: 156,
      activityCount: 24,
      tags: ['编程', '技术', '算法'],
      isJoined: true
    },
    {
      id: '2',
      name: '摄影俱乐部',
      description: '热爱摄影，记录美好生活',
      coverImage: 'https://via.placeholder.com/800x400?text=摄影俱乐部',
      memberCount: 89,
      activityCount: 18,
      tags: ['摄影', '艺术', '生活'],
      isJoined: false
    },
    {
      id: '3',
      name: '音乐社',
      description: '音乐爱好者的聚集地',
      coverImage: 'https://via.placeholder.com/800x400?text=音乐社',
      memberCount: 124,
      activityCount: 32,
      tags: ['音乐', '演奏', '创作'],
      isJoined: false
    },
    {
      id: '4',
      name: '篮球协会',
      description: '推广篮球运动，提高篮球水平',
      coverImage: 'https://via.placeholder.com/800x400?text=篮球协会',
      memberCount: 203,
      activityCount: 45,
      tags: ['体育', '篮球', '竞技'],
      isJoined: true
    }
  ],
  
  // 社团详情数据
  clubDetails: {
    id: '1',
    name: '编程协会',
    description: '编程协会成立于2018年，致力于为全校学生提供编程学习和技术交流的平台。我们定期举办技术讲座、编程竞赛、项目实战等活动，帮助成员提升编程能力和团队协作能力。无论你是编程新手还是有经验的开发者，都能在这里找到志同道合的伙伴。',
    coverImage: 'https://via.placeholder.com/1200x500?text=编程协会',
    memberCount: 156,
    activityCount: 24,
    joinDate: '2023-09-01',
    tags: ['编程', '技术', '算法', '前端', '后端', '人工智能'],
    members: [
      {
        id: '1',
        username: 'student1',
        role: '成员',
        joinDate: '2023-09-01',
        avatar: 'https://via.placeholder.com/40'
      },
      {
        id: '2',
        username: 'admin1',
        role: '社长',
        joinDate: '2023-08-01',
        avatar: 'https://via.placeholder.com/40'
      },
      {
        id: '3',
        username: 'member2',
        role: '成员',
        joinDate: '2023-09-15',
        avatar: 'https://via.placeholder.com/40'
      },
      {
        id: '4',
        username: 'member3',
        role: '成员',
        joinDate: '2023-10-01',
        avatar: 'https://via.placeholder.com/40'
      }
    ],
    activities: [
      {
        id: '1',
        title: '前端技术分享会',
        date: '2023-12-15',
        time: '19:00-21:00',
        location: '线上会议',
        image: 'https://via.placeholder.com/400x300?text=前端分享会',
        participantCount: 45
      },
      {
        id: '2',
        title: '编程竞赛赛前培训',
        date: '2023-12-20',
        time: '14:00-17:00',
        location: '计算机实验室',
        image: 'https://via.placeholder.com/400x300?text=竞赛培训',
        participantCount: 32
      },
      {
        id: '3',
        title: '开源项目贡献实践',
        date: '2023-12-25',
        time: '10:00-12:00',
        location: '线上会议',
        image: 'https://via.placeholder.com/400x300?text=开源项目',
        participantCount: 28
      }
    ],
    joinRequests: [
      {
        id: '1',
        username: 'newcomer1',
        applyDate: '2023-12-10',
        reason: '我对编程很感兴趣，希望能够加入协会学习更多知识。',
        avatar: 'https://via.placeholder.com/40'
      },
      {
        id: '2',
        username: 'newcomer2',
        applyDate: '2023-12-11',
        reason: '想提高自己的编程技能，结交更多志同道合的朋友。',
        avatar: 'https://via.placeholder.com/40'
      }
    ]
  },
  
  // 活动详情数据
  activityDetails: {
    id: '1',
    title: '前端技术分享会',
    clubId: '1',
    clubName: '编程协会',
    description: '本次分享会将聚焦于现代前端技术的发展趋势，包括React、Vue、Angular等主流框架的最新特性和最佳实践。我们邀请了有丰富经验的前端工程师来分享他们的工作经验和技术心得。无论你是前端初学者还是有一定经验的开发者，都能从中获益。',
    image: 'https://via.placeholder.com/800x400?text=前端技术分享会',
    date: '2023-12-15',
    time: '19:00-21:00',
    location: '线上会议',
    maxParticipants: 100,
    participantCount: 45,
    tags: ['前端', 'React', 'Vue', '技术分享'],
    createdBy: 'admin1',
    createdAt: '2023-11-30',
    isParticipating: true,
    isCreator: false,
    views: 128,
    participants: [
      {
        id: '1',
        username: 'student1',
        avatar: 'https://via.placeholder.com/40'
      },
      {
        id: '3',
        username: 'member2',
        avatar: 'https://via.placeholder.com/40'
      },
      {
        id: '4',
        username: 'member3',
        avatar: 'https://via.placeholder.com/40'
      }
    ],
    comments: [
      {
        id: '1',
        username: 'member2',
        content: '期待这次分享会！',
        createdAt: '2023-12-01 10:30',
        avatar: 'https://via.placeholder.com/40'
      },
      {
        id: '2',
        username: 'member3',
        content: '请问分享会有回放吗？',
        createdAt: '2023-12-02 14:20',
        avatar: 'https://via.placeholder.com/40'
      },
      {
        id: '3',
        username: 'admin1',
        content: '@member3 有的，分享会结束后会上传到协会网站。',
        createdAt: '2023-12-02 15:45',
        avatar: 'https://via.placeholder.com/40'
      }
    ]
  },
  
  // 所有活动列表
  activities: [
    {
      id: '1',
      title: '前端技术分享会',
      clubName: '编程协会',
      date: '2023-12-15',
      time: '19:00-21:00',
      location: '线上会议',
      image: 'https://via.placeholder.com/400x300?text=前端分享会',
      participantCount: 45,
      maxParticipants: 100,
      tags: ['前端', '技术']
    },
    {
      id: '2',
      title: '摄影外拍活动',
      clubName: '摄影俱乐部',
      date: '2023-12-16',
      time: '14:00-17:00',
      location: '城市公园',
      image: 'https://via.placeholder.com/400x300?text=摄影外拍',
      participantCount: 23,
      maxParticipants: 30,
      tags: ['摄影', '户外']
    },
    {
      id: '3',
      title: '校园音乐会',
      clubName: '音乐社',
      date: '2023-12-17',
      time: '19:30-21:30',
      location: '学生活动中心',
      image: 'https://via.placeholder.com/400x300?text=音乐会',
      participantCount: 150,
      maxParticipants: 200,
      tags: ['音乐', '演出']
    },
    {
      id: '4',
      title: '篮球友谊赛',
      clubName: '篮球协会',
      date: '2023-12-18',
      time: '16:00-18:00',
      location: '篮球场',
      image: 'https://via.placeholder.com/400x300?text=篮球友谊赛',
      participantCount: 20,
      maxParticipants: 20,
      tags: ['篮球', '体育']
    }
  ]
};

// 模拟API延迟
function delay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 模拟API响应
const mockAPI = {
  // 获取特色社团列表
  getFeaturedClubs: async () => {
    await delay();
    return mockData.clubs;
  },
  
  // 获取所有社团列表
  getAllClubs: async () => {
    await delay();
    return mockData.clubs;
  },
  
  // 获取社团详情
  getClubDetails: async (clubId) => {
    await delay();
    // 模拟根据ID返回对应社团详情
    return mockData.clubDetails;
  },
  
  // 获取活动列表
  getActivities: async (params = {}) => {
    await delay();
    // 模拟筛选逻辑
    let filteredActivities = [...mockData.activities];
    
    if (params.clubId) {
      filteredActivities = filteredActivities.filter(act => act.clubId === params.clubId);
    }
    
    return filteredActivities;
  },
  
  // 获取活动详情
  getActivityDetails: async (activityId) => {
    await delay();
    // 模拟根据ID返回对应活动详情
    return mockData.activityDetails;
  },
  
  // 获取当前用户信息
  getCurrentUser: async () => {
    await delay();
    return mockData.currentUser;
  },
  
  // 模拟用户登录
  login: async (credentials) => {
    await delay();
    // 模拟登录成功
    return {
      token: 'mock-jwt-token',
      user: mockData.currentUser
    };
  },
  
  // 模拟加入/退出社团
  toggleJoinClub: async (clubId) => {
    await delay();
    // 模拟成功响应
    return { success: true };
  },
  
  // 模拟参与/取消参与活动
  toggleParticipateActivity: async (activityId) => {
    await delay();
    // 模拟成功响应
    return { success: true };
  },
  
  // 模拟发布评论
  postComment: async (activityId, content) => {
    await delay();
    // 模拟成功响应
    return {
      id: Date.now().toString(),
      username: mockData.currentUser.username,
      content: content,
      createdAt: new Date().toLocaleString('zh-CN'),
      avatar: mockData.currentUser.avatar
    };
  }
};

// 暴露模拟数据和API
window.mockData = mockData;
window.mockAPI = mockAPI;