var GMapUtil = function() {
};

// localStorageに表示位置を保存しておき、次回表示時に復元する機能
GMapUtil.enableSaveInitialView = function(map) {
    // 保存されていたら復元
    var savedView = localStorage.getItem('savedView');
    if (savedView) {
        try {
            savedView = JSON.parse(savedView);
            if (savedView.lat && savedView.lng) {
                map.setCenter({ lat: savedView.lat, lng: savedView.lng });
            }
            if (savedView.zoom) {
                map.setZoom(savedView.zoom);
            }
        } catch (err) {
        }
    }

    // 移動するたび保存
    function onViewChanged() {
        var center = map.getCenter();
        var savedView =  { lat: center.lat(), lng: center.lng(), zoom: map.getZoom() };
        localStorage.setItem('savedView', JSON.stringify(savedView));
    };
    map.addListener('center_changed', onViewChanged);
    map.addListener('zoom_changed', onViewChanged);
}

// Google Mapsでスクロール等されたとき、location.hashを更新するようにする
GMapUtil.enableUpdateHash = function(map) {
    function onViewChanged() {
        var center = map.getCenter();
        app.state.centerLat = GMapUtil.round(center.lat(), 6);
        app.state.centerLng = GMapUtil.round(center.lng(), 6);
        app.state.zoom = map.getZoom();
    }

    map.addListener('center_changed', onViewChanged);
    map.addListener('zoom_changed', onViewChanged);
}

// Google Mapsに住所の検索ボックスを追加する
GMapUtil.addAddressBox = function(map, addressInputId) {
    var addressInput = document.getElementById(addressInputId);
    var searchBox = new google.maps.places.SearchBox(addressInput);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(addressInput);

    searchBox.addListener('places_changed', function() {
        var places = searchBox.getPlaces();
        if (places.length == 0) {
            return;
        }
        var bounds = new google.maps.LatLngBounds();
        places.forEach(function(place) {
            if (!place.geometry) {
                console.log('Returned place contains no geometry');
                return;
            }

            if (place.geometry.viewport) {
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });
        map.fitBounds(bounds);
    });
}

// Google Mapsの中心に十字マークを表示する
GMapUtil.addCrossHair = function(map) {
    var marker = new google.maps.Marker({
        map: map,
        icon: 'data:image/gif;base64,R0lGODlhEwATAJEAAAAAAICAgP///wAAACH5BAEAAAEALAAAAAATABMAAAIvjI+pKr0fBBBwSVrTzXpytH1GaDUmFp1OBLTu4bqYuqYqRH45t2d99cN5RDYipwAAOw==',
        clickable: false,
    });
    marker.bindTo('position', map, 'center');
}

// 地図クリックで出発・到着設定ウィンドウを表示するように
GMapUtil.enableSetOriginDestination = function(map, callback) {
    window.setAsWindow = new google.maps.InfoWindow({
        map: map,
    });

    ['originMarker', 'destinationMarker'].forEach(function(key) {
        if (window[key]) {
            window[key].setMap(null);
        }
        window[key] = new google.maps.Marker({
            map: map,
        });
        window[key].addListener('click', function(marker) {
            var latLng = window[key].getPosition();
            console.log(latLng.lat() + ',' + latLng.lng());
        });
    });

    window.setAs = function(as, lat, lng) {
        if (as == 'origin') {
            window.originMarker.setPosition({lat: lat, lng: lng});
            window.originMarker.setTitle('出発地: ' + lat + ',' + lng);
        } else if (as == 'destination') {
            window.destinationMarker.setPosition({lat: lat, lng: lng});
            window.destinationMarker.setTitle('到着地: ' + lat + ',' + lng);
        }
        setAsWindow.close();
        if (callback) {
            callback(as, lat, lng);
        }
    }

    map.addListener('click', function(e) {
        var lat = e.latLng.lat();
        var lng = e.latLng.lng();

        var content = '';
        content += '<a href="" onclick="setAs(\'origin\', ' + lat + ',' + lng + '); return false;" class="setAs">出発地に指定</a><br>';
        content += '<a href="" onclick="setAs(\'destination\', ' + lat + ',' + lng + '); return false;" class="setAs">到着地に指定</a>';

        setAsWindow.setContent(content);
        setAsWindow.setPosition(e.latLng);
        setAsWindow.open(map);
    });
}

// 数値を小数点以下n桁に丸める
GMapUtil.round = function(num, digitsAfterDot) {
    digitsAfterDot = digitsAfterDot || 6;
    var pow = Math.pow(10, digitsAfterDot);
    return Math.floor(num * pow) / pow;
}

// 緯度経度の配列から、バウンディングボックスを返す
GMapUtil.getBounds = function(latlngs) {
    var bounds = new google.maps.LatLngBounds();
    latlngs.forEach(function(latlng) {
        bounds.extend(latlng);
    });
    return bounds;
}
