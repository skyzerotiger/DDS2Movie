# DDS2Movie
DDS files to Movie file. Fast, Light, Realtime
    
DDS2Movie는 여러 장의 DDS 파일을 묶어 동영상으로 만들어 주는 툴입니다.      
주로 게임안에서 스프라이트 시트 애니메이션의 메모리 감소, 로딩 속도 증가등을 위해 만들어 졌습니다.   
DDS2Movie는 오디오를 지원하지 않으며 기존의 동영상을 대체하기 위해 만들어진 포맷은 아닙니다.   

DDS2Movie is a tool that combines multiple DDS files into a video.   
It was mainly made to reduce memory and increase loading speed of sprite sheet animations in games.   
DDS2Movie does not support audio and is not intended to replace traditional video.   

# 사용법(Usage)

Usage: node index.js fps sourcePath targetPath   
option:    
     -fps : Frame per second (Default 30)   
        
ex) node index.js c:\user\desktop\1 -fps 30   
