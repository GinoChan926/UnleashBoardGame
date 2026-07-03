# UnleashBoardGame
A HK version monopoly but better, use for secondary school financial education
Testing version ,How to run the game:
--Please install the GitHub boardgame document and install node.js in backend
--after finish set-up, open anew terminal

type the following command in terminal(I only works it in Window,
didn't try to run in Linux or Mac pls type other commend)

cd ..\project\backend

node server.js

then your termina should shows 

════════════════════════════════════════════════════════════╗
║   🎲 财富流沙盘 WebSocket 服务器                           ║
╠════════════════════════════════════════════════════════════╣
║   端口: 8080                                               ║
║   地址: http://localhost:8080                             ║
║   状态: 运行中                                              ║
╠════════════════════════════════════════════════════════════╣
║   👥 职业系统:                                             ║
║   👨‍⚕️ 医生 | 👨‍🔧 工程师 | 👩‍🏫 教师 | 🎨 艺术家 | 🚀 创业者      ║
╠════════════════════════════════════════════════════════════╣
║   📅 结算日机制:                                           ║
║   第5、13、21格 - 获得月薪+副业收入                        ║
║   正好踩中结算日 - 额外获得一次掷骰机会                    ║
╠════════════════════════════════════════════════════════════╣
║   ⚡ 精力系统:                                             ║
║   掷骰消耗1精力 | 结束回合恢复1精力                        ║
╠════════════════════════════════════════════════════════════╣
║   📚 机会卡系统:                                            ║
║   💼 兼职类: 13 张                        ║
║   📈 财务类: 6 张                        ║
║   🚀 创业类: 3 张                       ║
║   🏠 地产类: 6 张                       ║
╠════════════════════════════════════════════════════════════╣
║   🌐 访问地址: http://localhost:8080                      ║
╚════════════════════════════════════════════════════════════╝

Please Ctrl+ left click the http://localhost:8080        

Or open the browser：http://localhost:8080/frontend/index.html

# LAN-server for school competition
in the minPC server pls type following command below in terminal:
1. cd ../project/backend
2. node server.js

Then you open the server, next pls find the server IP(IPV4 address):
Window miniPC server:
1. Open Powershell and type the following command
2. ipconfig
3. Look for the IPv4 Address line

macOS miniPC server:
1.Open Terminal (found in Launchpad > Other).For internal IP:
2.If on Wi-Fi: ipconfig getifaddr en0
If on Ethernet: ipconfig getifaddr en1
3.For public IP (external access): curl ifconfig.me

Linux server:
1.Open a terminal.
2.ip addr show or ip a – lists all network interfaces with details.
Look for an interface that is UP (e.g., eth0, ens33, wlan0). Find the inet field – that's your IPv4 address (e.g., 192.168.1.100/24).

In the player computer (your own laptop or PC)
1.ping (the IPV4 address of the server)
2.Open a browser , type http://XXX.XXX.X.XXX:8080 (where the XXX.XXX.X.XXX is the IPV4 adress of server)
3.Finally connect the game , and enjoy



