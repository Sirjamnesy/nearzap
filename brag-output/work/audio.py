import numpy as np, wave
SR=44100; DUR=26.0; N=int(SR*DUR); BPM=120; B=60/BPM
t=np.arange(N)/SR
mix=np.zeros(N); sfx=np.zeros(N)
def n2f(m): return 440*2**((m-69)/12)
def mixs(a,b):
    n=max(len(a),len(b)); o=np.zeros(n); o[:len(a)]+=a; o[:len(b)]+=b; return o
def add(buf,start,sig,g=1.0):
    i=int(round(start*SR)); j=min(N,i+len(sig))
    if i<N: buf[i:j]+=g*sig[:j-i]
def env(d,a=0.005,dec=None):
    n=int(d*SR); x=np.arange(n)/SR
    e=np.minimum(1,x/a) if a>0 else np.ones(n)
    return e*(np.exp(-x/dec) if dec else np.ones(n))
def tone(f,d,harm=1,a=0.005,dec=None,detune=0):
    n=int(d*SR); x=np.arange(n)/SR; s=np.zeros(n)
    for h in range(1,harm+1):
        for dt in ([0] if not detune else [-detune,detune]):
            s+=np.sin(2*np.pi*f*h*(1+dt)*x)/h
    return s*env(d,a,dec)
# chords per 2s bar: Am F C G | Am F C G | Am F | C(end)
Am=(57,[57,60,64]);F=(53,[53,57,60]);C=(48,[48,52,55]);G=(55,[55,59,62])
CH=[Am,F,C,G,Am,F,C,G,C,G,F]  # Paid lands on C at 16.0; end resolves to C at 22.0
for bi,(root,ch) in enumerate(CH):
    t0=bi*2.0
    # pad
    for m in ch:
        p=tone(n2f(m),2.3,harm=5,a=0.25,detune=0.003)*np.minimum(1,np.linspace(4,0,int(2.3*SR)).clip(0,1)*1.0)
        add(mix,t0,p,0.045)
    # bass eighths
    for k in range(4*2):
        st=t0+k*B/2
        add(mix,st,tone(n2f(root-24),B/2*0.9,harm=4,a=0.004,dec=0.18),0.22)
    # pluck arp 8ths (skip during paid moment bar 11-12 first half for space)
    arp=[ch[0]+12,ch[1]+12,ch[2]+12,ch[1]+12,ch[0]+24,ch[2]+12,ch[1]+12,ch[2]+12]
    for k,m in enumerate(arp):
        st=t0+k*B/2
        if 15.0<=st<16.0: continue
        add(mix,st,tone(n2f(m),0.5,harm=3,a=0.002,dec=0.12),0.07)
# end chord C major, ring out
for m in [48,55,60,64,67,72]:
    add(mix,22.0,tone(n2f(m),4.0,harm=4,a=0.01,dec=1.4),0.06)
add(mix,22.0,tone(n2f(36),4.0,harm=3,a=0.01,dec=1.2),0.25)
# drums 0..18
def kick():
    d=0.35; x=np.arange(int(d*SR))/SR; f=45+80*np.exp(-x/0.04)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-x/0.12)
rng=np.random.default_rng(7)
def hat(d=0.06):
    n=int(d*SR); w=np.diff(rng.standard_normal(n+1)); return w*np.exp(-np.arange(n)/SR/0.015)
for k in range(int(22/B)):
    st=k*B
    g=0.55 if st<2 else 0.8
    if 15.0<=st<16.0: g=0.35  # breath before the Paid downbeat
    add(mix,st,kick(),g)
    add(mix,st+B/2,hat(),0.08 if st>=2 else 0.04)
    if st>=4 and k%2==1: add(mix,st,hat(0.18)*0.8,0.06)  # backbeat noise
# SFX (in key, soft)
def click(): return mixs(tone(n2f(84),0.05,harm=2,a=0.0005,dec=0.012),0.3*hat(0.03))
typing=[(0.625,1.5),(2.25,2.875),(3.0,3.375),(3.75,4.25),(4.5,4.5),(4.625,4.75),(5.5,5.5)]
for a,b in typing:
    k=0
    while a+k*0.125<=b+1e-6: add(sfx,a+k*0.125,click(),0.05); k+=1
# soft 'whoop' as the total hits $50.00, and a toast pop
for i,m in enumerate([72,76,79]): add(sfx,4.875+i*0.0625,tone(n2f(m),0.6,harm=2,a=0.002,dec=0.18),0.045)
for i,m in enumerate([76,81]): add(sfx,6.125+i*0.0625,tone(n2f(m),0.5,harm=2,a=0.002,dec=0.15),0.05)
for s in [1.75,3.5,5.75,6.625,11.75,20.875]: add(sfx,s,mixs(tone(n2f(76),0.12,harm=2,a=0.001,dec=0.03),0.4*hat(0.04)),0.16)
for k in range(12): add(sfx,19.0+k*0.125,click(),0.045)
def whoosh(d=0.6):
    n=int(d*SR); w=rng.standard_normal(n); w=np.convolve(w,np.ones(24)/24,'same')
    e=np.sin(np.pi*np.linspace(0,1,n))**2; return w*e
for s in [4.95,7.0,11.25,14.75,17.75,21.6]: add(sfx,s,whoosh(),0.35)
# Paid chime: C E G on the downbeat
for i,m in enumerate([84,88,91]): add(sfx,16.0+i*0.0625,tone(n2f(m),1.6,harm=2,a=0.002,dec=0.5),0.07)
# ring in at 11.3 to 12 (rising tone with the ring drawing)
n=int(0.7*SR); x=np.arange(n)/SR; f=n2f(64)*2**(x/0.7*1)
add(sfx,15.3,np.sin(2*np.pi*np.cumsum(f)/SR)*np.linspace(0,1,n)**2,0.035)
out=mix+sfx
# simple reverb: FFT conv with decaying noise IR
ir_n=int(1.6*SR); ir=rng.standard_normal(ir_n)*np.exp(-np.arange(ir_n)/SR/0.45); ir/=np.sqrt((ir**2).sum())
L=1<<int(np.ceil(np.log2(N+ir_n)))
wet=np.fft.irfft(np.fft.rfft(out,L)*np.fft.rfft(ir,L),L)[:N]
out=out+0.22*wet
# fade tail
out[-int(0.6*SR):]*=np.linspace(1,0,int(0.6*SR))
out=np.tanh(out*1.2)/1.2
out/=np.max(np.abs(out))*1.05
st=np.stack([out,np.roll(out,int(0.0007*SR))],1)
with wave.open('music.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype(np.int16).tobytes())
print('ok')
