package us.downers.downersnow.HTTPClient;

import org.json.JSONObject;

import java.util.EventListener;

/**
 * Created by josephkopinski on 3/20/15.
 */
public interface DGHttpListener {

    public void onResponse(String status,JSONObject response);

}
