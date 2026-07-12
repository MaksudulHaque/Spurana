package app.spurana.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;

/**
 * SPURANA · ChatHeadService — the Soul Bubble.
 * A floating ✦ that lives over every app. Drag it anywhere; it
 * snaps to the nearest edge. Tap it → Spurana opens straight
 * into the chat. Runs as a foreground service (Android law for
 * anything that persists over other apps).
 */
public class ChatHeadService extends Service {

  public static volatile boolean running = false;

  private WindowManager wm;
  private View bubble;
  private WindowManager.LayoutParams lp;

  @Override
  public IBinder onBind(Intent intent) { return null; }

  @Override
  public void onCreate() {
    super.onCreate();
    running = true;
    startInForeground();
    addBubble();
  }

  private void startInForeground() {
    String chId = "soul_bubble";
    NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationChannel ch = new NotificationChannel(chId, "Soul Bubble", NotificationManager.IMPORTANCE_MIN);
      ch.setDescription("Keeps her light floating above everything");
      nm.createNotificationChannel(ch);
    }
    Intent open = new Intent(this, MainActivity.class);
    open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
    PendingIntent pi = PendingIntent.getActivity(this, 1, open,
        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

    Notification.Builder b = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
        ? new Notification.Builder(this, chId)
        : new Notification.Builder(this);
    Notification n = b
        .setContentTitle("Soul Bubble")
        .setContentText("Her light floats above everything \u2726")
        .setSmallIcon(R.mipmap.ic_launcher)
        .setContentIntent(pi)
        .setOngoing(true)
        .build();

    if (Build.VERSION.SDK_INT >= 34) {
      startForeground(41, n, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
    } else {
      startForeground(41, n);
    }
  }

  private void addBubble() {
    wm = (WindowManager) getSystemService(WINDOW_SERVICE);

    TextView tv = new TextView(this);
    tv.setText("\u2726");
    tv.setTextSize(26);
    tv.setTypeface(Typeface.DEFAULT_BOLD);
    tv.setTextColor(Color.parseColor("#E2C28A"));
    tv.setGravity(Gravity.CENTER);
    int size = dp(58);
    GradientDrawable bg = new GradientDrawable(
        GradientDrawable.Orientation.TL_BR,
        new int[]{Color.parseColor("#E8009A"), Color.parseColor("#140A1A")});
    bg.setShape(GradientDrawable.OVAL);
    bg.setStroke(dp(2), Color.parseColor("#C9A96E"));
    tv.setBackground(bg);
    bubble = tv;

    int type = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
        ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        : WindowManager.LayoutParams.TYPE_PHONE;

    lp = new WindowManager.LayoutParams(size, size, type,
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
        PixelFormat.TRANSLUCENT);
    lp.gravity = Gravity.TOP | Gravity.START;
    lp.x = 0;
    lp.y = dp(180);

    bubble.setOnTouchListener(new View.OnTouchListener() {
      private int sx, sy; private float tx, ty; private boolean moved;
      @Override public boolean onTouch(View v, MotionEvent e) {
        switch (e.getAction()) {
          case MotionEvent.ACTION_DOWN:
            sx = lp.x; sy = lp.y; tx = e.getRawX(); ty = e.getRawY(); moved = false;
            return true;
          case MotionEvent.ACTION_MOVE:
            int dx = (int) (e.getRawX() - tx), dy = (int) (e.getRawY() - ty);
            if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved = true;
            lp.x = sx + dx; lp.y = sy + dy;
            try { wm.updateViewLayout(bubble, lp); } catch (Exception ex) {}
            return true;
          case MotionEvent.ACTION_UP:
            if (!moved) { openChat(); }
            else { snapToEdge(); }
            return true;
        }
        return false;
      }
    });

    try { wm.addView(bubble, lp); } catch (Exception e) { stopSelf(); }
  }

  private void snapToEdge() {
    try {
      int screenW = getResources().getDisplayMetrics().widthPixels;
      lp.x = (lp.x + dp(29) < screenW / 2) ? 0 : screenW - dp(58);
      wm.updateViewLayout(bubble, lp);
    } catch (Exception e) {}
  }

  private void openChat() {
    Intent i = new Intent(this, MainActivity.class);
    i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
    i.putExtra("spurana_route", "chat");
    try { startActivity(i); } catch (Exception e) {}
  }

  private int dp(int v) {
    return (int) (v * getResources().getDisplayMetrics().density + 0.5f);
  }

  @Override
  public void onDestroy() {
    running = false;
    try { if (wm != null && bubble != null) wm.removeView(bubble); } catch (Exception e) {}
    super.onDestroy();
  }
}
