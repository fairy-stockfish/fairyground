var CanvasHandlerInstance = null;
var CurrentCanvasWorkerState = "Uninitialized";

function GenerateRandomPointInside(MinY, MaxY, MinX, MaxX) {
  if (
    typeof MinX != "number" ||
    typeof MinY != "number" ||
    typeof MaxX != "number" ||
    typeof MaxY != "number"
  ) {
    throw TypeError("");
  }
  return {
    x: MinX + Math.random() * (MaxX - MinX),
    y: MinY + Math.random() * (MaxY - MinY),
  };
}

function RandomNumberBetween(Start, End) {
  return Start + Math.random() * (End - Start);
}

function IntroTransparency(CurrentTime, TimeDelay) {
  return (
    0.5 *
    (1 -
      Math.cos(2 * Math.PI * Math.max(0, Math.min(1, CurrentTime - TimeDelay))))
  );
}

class Point {
  constructor(
    X,
    Y,
    MinY,
    MaxY,
    MinX,
    MaxX,
    Speed,
    Angle,
    Size,
    LifeDurationFrames,
    InitialFrameCounter,
  ) {
    if (
      typeof X != "number" ||
      typeof Y != "number" ||
      typeof MinX != "number" ||
      typeof MinY != "number" ||
      typeof MaxX != "number" ||
      typeof MaxY != "number" ||
      typeof Speed != "number" ||
      typeof Angle != "number" ||
      typeof Size != "number" ||
      typeof LifeDurationFrames != "number" ||
      typeof InitialFrameCounter != "number"
    ) {
      throw TypeError("");
    }
    this.X = X;
    this.Y = Y;
    this.MinX = MinX;
    this.MaxX = MaxX;
    this.MinY = MinY;
    this.MaxY = MaxY;
    this.Speed = Speed;
    this.Angle = Angle;
    this.SpeedX = this.Speed * Math.cos(this.Angle);
    this.SpeedY = this.Speed * Math.sin(this.Angle);
    this.Size = Size;
    this.Acceleration = 1;
    this.State = 0;
    this.FrameCounter = InitialFrameCounter;
    this.LifeDurationFrames = LifeDurationFrames;
    this.Alpha = 0;
    this.OriginalSize = Size;
  }

  NextPosition() {
    let FinalX = this.X + this.SpeedX;
    let FinalY = this.Y + this.SpeedY;
    if (FinalX <= this.MinX) {
      if (FinalY <= this.MinY) {
        this.Angle = (Math.random() * Math.PI) / 2;
        FinalY = this.MinY;
      } else if (FinalY >= this.MaxY) {
        this.Angle = (-Math.random() * Math.PI) / 2;
        FinalY = this.MaxY;
      } else {
        this.Angle = (Math.random() - 0.5) * Math.PI;
      }
      FinalX = this.MinX;
      this.ChangingAngle = true;
    } else if (FinalX >= this.MaxX) {
      if (FinalY <= this.MinY) {
        this.Angle = ((Math.random() + 1) * Math.PI) / 2;
        FinalY = this.MinY;
      } else if (FinalY >= this.MaxY) {
        this.Angle = (-(Math.random() + 1) * Math.PI) / 2;
        FinalY = this.MaxY;
      } else {
        this.Angle = (Math.random() + 0.5) * Math.PI;
      }
      FinalX = this.MaxX;
      this.ChangingAngle = true;
    } else {
      if (FinalY <= this.MinY) {
        this.Angle = Math.random() * Math.PI;
        FinalY = this.MinY;
        this.ChangingAngle = true;
      } else if (FinalY >= this.MaxY) {
        this.Angle = -(Math.random() * Math.PI);
        FinalY = this.MaxY;
        this.ChangingAngle = true;
      }
    }
    this.X = FinalX;
    this.Y = FinalY;
    if (this.ChangingAngle) {
      this.SetAngle(this.Angle);
    }
    this.Speed *= this.Acceleration;
    this.SpeedX *= this.Acceleration;
    this.SpeedY *= this.Acceleration;
  }

  GetPositionOnCanvas(CanvasWidth, CanvasHeight) {
    if (typeof CanvasWidth != "number" || typeof CanvasHeight != "number") {
      throw TypeError("");
    }
    return { x: this.X, y: CanvasHeight - this.Y };
  }

  SetAngle(Angle) {
    if (typeof Angle != "number") {
      throw TypeError("");
    }
    this.ChangingAngle = false;
    this.SpeedX = this.Speed * Math.cos(Angle);
    this.SpeedY = this.Speed * Math.sin(Angle);
  }

  Randomize() {
    let pos = GenerateRandomPointInside(
      this.MinY,
      this.MaxY,
      this.MinX,
      this.MaxX,
    );
    this.X = pos.x;
    this.Y = pos.y;
    this.Angle = Math.random() * Math.PI * 2;
  }
}

class FadeAwayPoint {
  constructor(
    X,
    Y,
    Speed,
    Angle,
    Size,
    AccelerationChangeFrameLength,
    AccelerationFactor,
  ) {
    if (
      typeof X != "number" ||
      typeof Y != "number" ||
      typeof Speed != "number" ||
      typeof Angle != "number" ||
      typeof Size != "number" ||
      typeof AccelerationChangeFrameLength != "number" ||
      typeof AccelerationFactor != "number"
    ) {
      throw TypeError("");
    }
    this.X = X;
    this.Y = Y;
    this.InitialSpeed = Speed;
    this.Angle = Angle;
    this.Size = Size;
    this.InitialFrameCounter = this.InitialFrameCounter;
    this.AccelerationChangeFrameLength = AccelerationChangeFrameLength;
    this.AccelerationFactor = AccelerationFactor;
    this.FrameCounter = 0;
    this.SpeedX = this.InitialSpeed * Math.cos(this.Angle);
    this.SpeedY = this.InitialSpeed * Math.sin(this.Angle);
    this.AccelerationX = 0;
    this.AccelerationY = 0;
  }

  NextPosition() {
    this.X += this.SpeedX;
    this.Y += this.SpeedY;
    if (this.FrameCounter % this.AccelerationChangeFrameLength == 0) {
      let random_angle = Math.random() * 0.5 * Math.PI;
      this.AccelerationX =
        this.InitialSpeed * this.AccelerationFactor * Math.cos(random_angle);
      this.AccelerationY =
        this.InitialSpeed * this.AccelerationFactor * Math.sin(random_angle);
    }
    this.SpeedX += this.AccelerationX;
    this.SpeedY += this.AccelerationY;
    this.FrameCounter++;
  }

  GetPositionOnCanvas(CanvasWidth, CanvasHeight) {
    if (typeof CanvasWidth != "number" || typeof CanvasHeight != "number") {
      throw TypeError("");
    }
    return { x: this.X, y: CanvasHeight - this.Y };
  }
}

class CanvasHandler {
  constructor(ContainerOffscreenCanvas, FrameRate, ID) {
    if (
      !(ContainerOffscreenCanvas instanceof OffscreenCanvas) ||
      typeof FrameRate != "number" ||
      typeof ID != "number"
    ) {
      throw TypeError("");
    }
    this.Identification = ID;
    this.Canvas = ContainerOffscreenCanvas;
    this.CanvasContext = this.Canvas.getContext("2d");
    this.Points = [];
    this.FrameRate = FrameRate;
    this.RenderInterval = 1000 / FrameRate;
    this.StoppedRendering = false;
    this.IsRendering = false;
    this.GlobalAlpha = 0.7;
    this.State = 0;
    this.Unstoppable = false;
    this.PointColorRed = 29;
    this.PointColorGreen = 79;
    this.PointColorBlue = 216;
    this.MinPointLifetime = 5;
    this.MaxPointLifetime = 10;
    this.PointFadeTime = 2;
    this.PointFadeFrames = this.PointFadeTime * FrameRate;
    this.LinkFadeNearDistance = 80;
    this.LinkFadeFarDistance = 150;
    this.MinPointMoveSpeed = 10;
    this.MaxPointMoveSpeed = 30;
    this.PointSize = 4;
    this.LineSize = this.PointSize / 2;
    this.IntroFrameCounter = 0;
    this.OutroFrameCounter = 0;
    this.IntroMeshUnitSize = 100;
    this.OutroFadeAwayPoints = [];
    this.FadeAwayPointMinSpeed = 1;
    this.FadeAwayPointMaxSpeed = 5;
    this.FadeAwayPointAccelerationFactor = 2.5;
    this.RenderFunction = null;
    this.Timer = null;
    this.PI2 = 2 * Math.PI;
    let i = 0;
    let randompos = null;
    for (i = 0; i < (this.Canvas.width * this.Canvas.height) / 10000; i++) {
      randompos = GenerateRandomPointInside(
        0,
        this.Canvas.height,
        0,
        this.Canvas.width,
      );
      this.Points.push(
        new Point(
          randompos.x,
          randompos.y,
          0,
          this.Canvas.height,
          0,
          this.Canvas.width,
          0,
          0,
          this.PointSize,
          RandomNumberBetween(this.MinPointLifetime, this.MaxPointLifetime) *
            FrameRate,
          0,
        ),
      );
    }
    this.CanvasContext.globalAlpha = this.GlobalAlpha;
  }

  destructor() {
    self.postMessage({
      message: "CanvasHandlerDestroyed",
      id: this.Identification,
    });
    if (this.Timer != null) {
      clearInterval(this.Timer);
    }
    CurrentCanvasWorkerState = "Uninitialized";
  }

  StartRender() {
    this.StoppedRendering = false;
    this.IsRendering = true;
    if (this.Timer == null) {
      this.RenderFunction = this.RenderFrame.bind(this);
      this.Timer = setInterval(() => {
        if (!this.Unstoppable && this.StoppedRendering) {
          return;
        }
        requestAnimationFrame(this.RenderFunction);
      }, this.RenderInterval);
    }
  }

  StopRender() {
    this.StoppedRendering = true;
    this.IsRendering = false;
  }

  CloseCanvas() {
    this.State = 2;
    this.Unstoppable = true;
    this.IsRendering = false;
    if (this.StoppedRendering) {
      this.StartRender();
    }
  }

  ResizeTo(NewCanvasWidthInPixels, NewCanvasHeightInPixels) {
    if (
      typeof NewCanvasWidthInPixels != "number" ||
      typeof NewCanvasHeightInPixels != "number"
    ) {
      throw TypeError("");
    }
    let i = 0;
    this.CanvasContext.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
    this.Points = [];
    this.Canvas.width = NewCanvasWidthInPixels;
    this.Canvas.height = NewCanvasHeightInPixels;
    let randompos = null;
    for (
      i = 0;
      i < (NewCanvasWidthInPixels * NewCanvasHeightInPixels) / 10000;
      i++
    ) {
      randompos = GenerateRandomPointInside(
        0,
        NewCanvasHeightInPixels,
        0,
        NewCanvasWidthInPixels,
      );
      this.Points.push(
        new Point(
          randompos.x,
          randompos.y,
          0,
          NewCanvasHeightInPixels,
          0,
          NewCanvasWidthInPixels,
          0,
          0,
          this.PointSize,
          RandomNumberBetween(this.MinPointLifetime, this.MaxPointLifetime) *
            this.FrameRate,
          this.PointFadeFrames,
        ),
      );
    }
    this.CanvasContext.globalAlpha = this.GlobalAlpha;
  }

  MoveToContainer(NewContainerHTMLDivElement) {
    if (!(NewContainerHTMLDivElement instanceof HTMLDivElement)) {
      throw TypeError("");
    }
    this.Container.removeChild(this.Canvas);
    NewContainerHTMLDivElement.appendChild(this.Canvas);
    this.Container = NewContainerHTMLDivElement;
  }

  RenderFrame() {
    let i = 0;
    let j = 0;
    if (this.State == 0) {
      let width = this.Canvas.width;
      let height = this.Canvas.height;
      let center_x = width / 2;
      let center_y = height / 2;
      let radius = Math.max(center_x, center_y);
      let half_mesh_size = Math.ceil(radius / this.IntroMeshUnitSize) + 1;
      let mesh_size = half_mesh_size * 2 - 1;
      let mesh_start_x =
        center_x - (half_mesh_size - 1) * this.IntroMeshUnitSize;
      let mesh_start_y =
        center_y - (half_mesh_size - 1) * this.IntroMeshUnitSize;
      let center_mesh = half_mesh_size - 1;
      let alpha = 0;
      let distance = 0;
      let delay = 0;
      let transparencies = [];
      transparencies.length = mesh_size * mesh_size;
      this.CanvasContext.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
      for (i = 0; i < mesh_size; i++) {
        for (j = 0; j < mesh_size; j++) {
          distance = Math.sqrt(
            (i - center_mesh) * (i - center_mesh) +
              (j - center_mesh) * (j - center_mesh),
          );
          delay = distance / half_mesh_size;
          alpha = IntroTransparency(
            this.IntroFrameCounter / this.FrameRate,
            delay,
          );
          transparencies[i * mesh_size + j] = alpha;
          this.CanvasContext.beginPath();
          this.CanvasContext.arc(
            mesh_start_x + i * this.IntroMeshUnitSize,
            mesh_start_y + j * this.IntroMeshUnitSize,
            this.PointSize,
            0,
            this.PI2,
          );
          this.CanvasContext.fillStyle = `rgba(${this.PointColorRed},${this.PointColorGreen},${this.PointColorBlue},${alpha})`;
          this.CanvasContext.fill();
          this.CanvasContext.closePath();
        }
      }
      for (i = 0; i < mesh_size; i++) {
        for (j = 0; j < mesh_size; j++) {
          if (i < mesh_size - 1) {
            alpha = Math.min(
              transparencies[i * mesh_size + j],
              transparencies[(i + 1) * mesh_size + j],
            );
            this.CanvasContext.beginPath();
            this.CanvasContext.strokeStyle = `rgba(${this.PointColorRed},${this.PointColorGreen},${this.PointColorBlue},${alpha})`;
            this.CanvasContext.lineWidth = this.LineSize;
            this.CanvasContext.moveTo(
              mesh_start_x + i * this.IntroMeshUnitSize,
              mesh_start_y + j * this.IntroMeshUnitSize,
            );
            this.CanvasContext.lineTo(
              mesh_start_x + (i + 1) * this.IntroMeshUnitSize,
              mesh_start_y + j * this.IntroMeshUnitSize,
            );
            this.CanvasContext.stroke();
          }
          if (j < mesh_size - 1) {
            alpha = Math.min(
              transparencies[i * mesh_size + j],
              transparencies[i * mesh_size + j + 1],
            );
            this.CanvasContext.beginPath();
            this.CanvasContext.strokeStyle = `rgba(${this.PointColorRed},${this.PointColorGreen},${this.PointColorBlue},${alpha})`;
            this.CanvasContext.lineWidth = this.LineSize;
            this.CanvasContext.moveTo(
              mesh_start_x + i * this.IntroMeshUnitSize,
              mesh_start_y + j * this.IntroMeshUnitSize,
            );
            this.CanvasContext.lineTo(
              mesh_start_x + i * this.IntroMeshUnitSize,
              mesh_start_y + (j + 1) * this.IntroMeshUnitSize,
            );
            this.CanvasContext.stroke();
          }
        }
      }
      if (this.IntroFrameCounter > 2 * this.FrameRate) {
        this.State = 1;
      } else {
        this.IntroFrameCounter++;
      }
    } else if (this.State == 1) {
      let pos = null;
      let pos2 = null;
      let selected = null;
      let alpha = 0;
      let alpha2 = 0;
      let distance = 0;
      this.CanvasContext.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
      for (i = 0; i < this.Points.length; i++) {
        selected = this.Points[i];
        pos = selected.GetPositionOnCanvas(
          this.Canvas.width,
          this.Canvas.height,
        );
        if (selected.FrameCounter < this.PointFadeFrames) {
          alpha = selected.FrameCounter / this.PointFadeFrames;
        } else if (
          selected.FrameCounter >
          this.PointFadeFrames + selected.LifeDurationFrames
        ) {
          alpha =
            1 -
            (selected.FrameCounter -
              this.PointFadeFrames -
              selected.LifeDurationFrames) /
              this.PointFadeFrames;
        } else {
          alpha = 1;
        }
        selected.Alpha = alpha;
        this.CanvasContext.beginPath();
        this.CanvasContext.arc(pos.x, pos.y, selected.Size, 0, this.PI2);
        this.CanvasContext.fillStyle = `rgba(${this.PointColorRed},${this.PointColorGreen},${this.PointColorBlue},${alpha})`;
        this.CanvasContext.fill();
        this.CanvasContext.closePath();
        if (selected.Speed < 0.5 / this.FrameRate) {
          selected.Speed =
            RandomNumberBetween(
              this.MinPointMoveSpeed,
              this.MaxPointMoveSpeed,
            ) / this.FrameRate;
          selected.Acceleration = 1;
          selected.SetAngle(Math.random() * this.PI2);
        }
        for (j = i + 1; j < this.Points.length; j++) {
          pos2 = this.Points[j].GetPositionOnCanvas(
            this.Canvas.width,
            this.Canvas.height,
          );
          distance = Math.sqrt(
            (pos.x - pos2.x) * (pos.x - pos2.x) +
              (pos.y - pos2.y) * (pos.y - pos2.y),
          );
          if (distance < this.LinkFadeFarDistance) {
            alpha2 =
              1 -
              (distance - this.LinkFadeNearDistance) /
                (this.LinkFadeFarDistance - this.LinkFadeNearDistance);
            if (alpha2 > 1) {
              alpha2 = 1;
            }
            this.CanvasContext.beginPath();
            this.CanvasContext.strokeStyle = `rgba(${this.PointColorRed},${this.PointColorGreen},${this.PointColorBlue},${Math.min(alpha, this.Points[j].Alpha) * alpha2})`;
            this.CanvasContext.lineWidth = this.LineSize;
            this.CanvasContext.moveTo(pos.x, pos.y);
            this.CanvasContext.lineTo(pos2.x, pos2.y);
            this.CanvasContext.stroke();
          }
        }
        if (
          selected.FrameCounter <
          2 * this.PointFadeFrames + selected.LifeDurationFrames
        ) {
          selected.NextPosition();
          selected.FrameCounter++;
        } else {
          selected.Randomize();
          selected.FrameCounter = 0;
        }
      }
    } else if (this.State == 2) {
      let selected = null;
      let selected2 = null;
      let distance = 0;
      let offset = 0;
      let vec_x = 0;
      let vec_y = 0;
      let ratio = 0;
      let accel_factor = this.FadeAwayPointAccelerationFactor / this.FrameRate;
      for (i = 0; i < this.Points.length; i++) {
        selected = this.Points[i];
        this.OutroFadeAwayPoints.push(
          new FadeAwayPoint(
            selected.X,
            selected.Y,
            RandomNumberBetween(
              this.FadeAwayPointMinSpeed,
              this.FadeAwayPointMaxSpeed,
            ),
            Math.PI * (0.5 + (Math.random() - 0.5) * 0.2),
            this.LineSize,
            Math.round(0.25 * this.FrameRate),
            accel_factor,
          ),
        );
        this.OutroFadeAwayPoints.push(
          new FadeAwayPoint(
            selected.X,
            selected.Y,
            RandomNumberBetween(
              this.FadeAwayPointMinSpeed,
              this.FadeAwayPointMaxSpeed,
            ),
            Math.PI * (0.5 + (Math.random() - 0.5) * 0.2),
            this.LineSize,
            Math.round(0.25 * this.FrameRate),
            accel_factor,
          ),
        );
        for (j = i + 1; j < this.Points.length; j++) {
          selected2 = this.Points[j];
          distance = Math.sqrt(
            (selected.X - selected2.X) * (selected.X - selected2.X) +
              (selected.Y - selected2.Y) * (selected.Y - selected2.Y),
          );
          if (distance < this.LinkFadeFarDistance) {
            vec_x = selected2.X - selected.X;
            vec_y = selected2.Y - selected.Y;
            for (
              offset = this.LineSize;
              offset < distance;
              offset += 3 * this.LineSize
            ) {
              ratio = offset / distance;
              this.OutroFadeAwayPoints.push(
                new FadeAwayPoint(
                  selected.X + ratio * vec_x,
                  selected.Y + ratio * vec_y,
                  RandomNumberBetween(
                    this.FadeAwayPointMinSpeed,
                    this.FadeAwayPointMaxSpeed,
                  ),
                  Math.PI * (0.5 + (Math.random() - 0.5) * 0.2),
                  this.LineSize,
                  Math.round(0.25 * this.FrameRate),
                  accel_factor,
                ),
              );
            }
          }
        }
      }
      this.State = 3;
    } else if (this.State == 3) {
      let selected = null;
      let pos = null;
      let alpha = 1 - this.OutroFrameCounter / (2 * this.FrameRate);
      this.CanvasContext.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
      for (i = 0; i < this.OutroFadeAwayPoints.length; i++) {
        selected = this.OutroFadeAwayPoints[i];
        pos = selected.GetPositionOnCanvas(
          this.Canvas.width,
          this.Canvas.height,
        );
        this.CanvasContext.beginPath();
        this.CanvasContext.arc(pos.x, pos.y, selected.Size, 0, this.PI2);
        this.CanvasContext.fillStyle = `rgba(${this.PointColorRed},${this.PointColorGreen},${this.PointColorBlue},${alpha})`;
        this.CanvasContext.fill();
        this.CanvasContext.closePath();
        selected.NextPosition();
      }
      if (this.OutroFrameCounter < 2 * this.FrameRate) {
        this.OutroFrameCounter++;
      } else {
        this.destructor();
        return;
      }
    }
  }
}

self.onmessage = function (event) {
  const message = event.data;
  if (message.message == "Start") {
    if (CurrentCanvasWorkerState != "Uninitialized") {
      console.warn(
        "Attemptting to create a new instance while another one is present.",
      );
      return;
    }
    CanvasHandlerInstance = new CanvasHandler(
      message.canvas,
      message.framerate,
      message.id,
    );
    CanvasHandlerInstance.StartRender();
    CurrentCanvasWorkerState = "Running";
  } else if (message.message == "Resize") {
    if (CurrentCanvasWorkerState != "Running") {
      return;
    }
    CanvasHandlerInstance.ResizeTo(message.width, message.height);
  } else if (message.message == "Continue") {
    if (CurrentCanvasWorkerState != "Stopped") {
      return;
    }
    CanvasHandlerInstance.StartRender();
    CurrentCanvasWorkerState = "Running";
  } else if (message.message == "Stop") {
    if (CurrentCanvasWorkerState != "Running") {
      return;
    }
    CanvasHandlerInstance.StopRender();
    CurrentCanvasWorkerState = "Stopped";
  } else if (message.message == "Terminate") {
    if (CurrentCanvasWorkerState == "Uninitialized") {
      return;
    }
    CanvasHandlerInstance.CloseCanvas();
  } else if (message.message == "State") {
    self.postMessage({ message: "State", state: CurrentCanvasWorkerState });
  }
};
