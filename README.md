# DDS2Movie-Maker
DDS sheet animation optimizer. Free, Light, Realtime
    
DDS2Movie는 주로 게임안에서 스프라이트 시트 애니메이션의 메모리 감소, 로딩 속도 증가등을 위해 만들어 졌습니다.   
DDS2Movie는 오디오를 지원하지 않으며 기존의 동영상을 대체하기 위해 만들어진 포맷은 아닙니다.   

DDS2Movie is primarily designed to reduce memory and increase loading speed of sprite sheet animations in games.
DDS2Movie does not support audio and is not intended to replace traditional video.   

# Performance
![](https://github.com/skyzerotiger/DDS2Movie-Player/blob/main/preview/dds_preview.png)
![](https://github.com/skyzerotiger/DDS2Movie-Player/blob/main/preview/d2m_preview.gif)   
sprite 256x256 30 sprite   
None compress 256KB x 30 sprite = 7,680KB   
DXT5 compress 64KB x 30 sprite = 1,920KB   
D2M **463KB**   

# 사용법(Usage)
Usage: node index.js fps sourcePath targetPath   
option:    
     -fps : Frame per second (Default 30)   
        
ex) node index.js c:\user\desktop\1 -fps 30   

# Player
[DDS2Movie-Player](https://github.com/skyzerotiger/DDS2Movie-Player)

# support me
[buy me a coffee](https://www.buymeacoffee.com/skyzero)
