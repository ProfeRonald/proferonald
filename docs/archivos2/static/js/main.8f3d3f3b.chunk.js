(this["webpackJsonpreact-file-manager-with-google-cloud"] =
  this["webpackJsonpreact-file-manager-with-google-cloud"] || []).push([
  [0],
  {
    33: function (e, a, t) {
      e.exports = t(55);
    },
    54: function (e, a, t) {},
    55: function (e, a, t) {
      "use strict";
      t.r(a);
      var n = t(0),
        r = t.n(n),
        l = t(27),
        c = t.n(l),
        o = t(8),
        i = t(12),
        s = t(6),
        u = t.n(s),
        m = t(10),
        p = t(7),
        f = t(17),
        d = t(16),
        E = t.n(d);
      t(41), t(44), t(56);
      E.a.initializeApp({
        apiKey: "AIzaSyCBmK4AbGuze_pH7r5dZpMCEIgpUGKwSYM",
        authDomain: "proferonald.com",
        databaseURL: "https://proferonald-fb-default-rtdb.firebaseio.com",
        projectId: "proferonald-fb",
        storageBucket: "proferonald-fb.appspot.com",
        messagingSenderId: "647906089395",
        appId: "1:647906089395:web:72421f937bbf9f6a3693c6",
        measurementId: "G-JYVC11X4W4",
      });
      E.a.database();
      var h = E.a.storage(),
        v = (new E.a.auth.GoogleAuthProvider(), t(3)),
        b = t(4),
        g = t(15),
        w = t.n(g),
        N = function (e) {
          var a = e.file,
            t = e.getFiles,
            l = Object(n.useState)(),
            c = Object(o.a)(l, 2),
            i = c[0],
            s = c[1],
            p = Object(n.useState)(!1),
            f = Object(o.a)(p, 2),
            d = f[0],
            E = f[1];
          Object(n.useEffect)(
            function () {
              setTimeout(function () {
                E(!1);
              }, 3500);
            },
            [d]
          ),
            Object(n.useEffect)(
              function () {
                (function () {
                  var e = Object(m.a)(
                    u.a.mark(function e(a) {
                      var t;
                      return u.a.wrap(function (e) {
                        for (;;)
                          switch ((e.prev = e.next)) {
                            case 0:
                              return (
                                (e.next = 2), h.ref("".concat(a)).getMetadata()
                              );
                            case 2:
                              (t = e.sent), s(t);
                            case 4:
                            case "end":
                              return e.stop();
                          }
                      }, e);
                    })
                  );
                  return function (a) {
                    return e.apply(this, arguments);
                  };
                })()(a.fullPath);
              },
              [a]
            );
          var g = (function () {
              var e = Object(m.a)(
                u.a.mark(function e(a) {
                  var t;
                  return u.a.wrap(
                    function (e) {
                      for (;;)
                        switch ((e.prev = e.next)) {
                          case 0:
                            return (
                              (e.prev = 0),
                              (e.next = 3),
                              h.ref(a).getDownloadURL()
                            );
                          case 3:
                            (t = e.sent) && window.open(t), (e.next = 10);
                            break;
                          case 7:
                            (e.prev = 7),
                              (e.t0 = e.catch(0)),
                              console.log(e.t0);
                          case 10:
                            return e.abrupt(
                              "return",
                              console.log("downloaded")
                            );
                          case 11:
                          case "end":
                            return e.stop();
                        }
                    },
                    e,
                    null,
                    [[0, 7]]
                  );
                })
              );
              return function (a) {
                return e.apply(this, arguments);
              };
            })(),
            N = (function () {
              var e = Object(m.a)(
                u.a.mark(function e(a) {
                  return u.a.wrap(
                    function (e) {
                      for (;;)
                        switch ((e.prev = e.next)) {
                          case 0:
                            return (
                              (e.prev = 0), (e.next = 3), h.ref(a).delete()
                            );
                          case 3:
                            t(), (e.next = 9);
                            break;
                          case 6:
                            (e.prev = 6), (e.t0 = e.catch(0)), E(!0);
                          case 9:
                          case "end":
                            return e.stop();
                        }
                    },
                    e,
                    null,
                    [[0, 6]]
                  );
                })
              );
              return function (a) {
                return e.apply(this, arguments);
              };
            })();
          return r.a.createElement(
            "li",
            null,
            r.a.createElement(
              "span",
              {
                onClick: function () {
                  return g(i.fullPath);
                },
              },
              r.a.createElement(v.a, { icon: b.b, color: "#04A0FF" }),
              " ",
              a.name
            ),
            r.a.createElement(
              "span",
              null,
              i && w()(i.timeCreated).format("DD.MM.YYYY HH:mm")
            ),
            r.a.createElement("span", null, i && i.contentType),
            r.a.createElement(
              "span",
              null,
              i &&
                (function (e) {
                  if (0 === e) return "0 Byte";
                  var a = parseInt(Math.floor(Math.log(e) / Math.log(1024)));
                  return (
                    Math.round(e / Math.pow(1024, a), 2) +
                    " " +
                    ["Bytes", "KB", "MB", "GB", "TB"][a]
                  );
                })(i.size)
            ),
            r.a.createElement(
              "span",
              { className: "actions" },
              r.a.createElement(v.a, {
                icon: b.m,
                color: "red",
                onClick: function () {
                  return N(i.fullPath);
                },
              })
            ),
            d &&
              r.a.createElement(
                "div",
                {
                  style: {
                    position: "fixed",
                    bottom: "50px",
                    right: "20px",
                    textAlign: "center",
                    padding: "10px",
                    width: "200px",
                    background: "rgba(251, 49, 49, 0.52)",
                    color: "#d04d64",
                  },
                },
                "Delete is not available in demo mode"
              )
          );
        },
        k = function (e) {
          var a = e.showFileExplorer,
            t = e.title;
          return r.a.createElement(
            "div",
            { className: "file-explorer--topbar" },
            r.a.createElement(
              "div",
              null,
              r.a.createElement(
                "span",
                { className: "header-icon", "data-title": t },
                r.a.createElement(v.a, { icon: b.e, color: "gold" })
              )
            ),
            r.a.createElement(
              "div",
              null,
              r.a.createElement(
                "span",
                null,
                r.a.createElement(v.a, { icon: b.l, color: "#ccc", onClick: a })
              )
            )
          );
        },
        x = function () {
          return r.a.createElement(
            "div",
            { className: "file-explorer--menu" },
            r.a.createElement(
              "nav",
              null,
              r.a.createElement(
                "ul",
                null,
                r.a.createElement("li", { className: "active-menu" }, "File"),
                r.a.createElement("li", null, "Display")
              )
            ),
            r.a.createElement(
              "nav",
              null,
              r.a.createElement(
                "ul",
                null,
                r.a.createElement(
                  "li",
                  null,
                  r.a.createElement(v.a, { icon: b.j, color: "#0078D7" })
                )
              )
            )
          );
        },
        j = function (e) {
          var a = e.history;
          return r.a.createElement(
            "div",
            { className: "file-explorer--actions" },
            r.a.createElement(
              "div",
              null,
              r.a.createElement(
                "span",
                null,
                r.a.createElement(v.a, {
                  icon: b.g,
                  color: "#ccc",
                  onClick: function () {
                    return a.goBack();
                  },
                })
              ),
              r.a.createElement(
                "span",
                null,
                r.a.createElement(v.a, {
                  icon: b.h,
                  color: "#ccc",
                  onClick: function () {
                    return a.goForward();
                  },
                })
              ),
              r.a.createElement(
                "span",
                null,
                r.a.createElement(v.a, { icon: b.i, color: "#666" })
              )
            ),
            r.a.createElement(
              "div",
              null,
              r.a.createElement(
                "ul",
                null,
                r.a.createElement(
                  "li",
                  null,
                  r.a.createElement(
                    f.a,
                    { to: "/" },
                    r.a.createElement(v.a, { icon: b.f, color: "gold" })
                  )
                ),
                a.location.pathname.split("/").map(function (e, a) {
                  return e && r.a.createElement("li", { key: a }, e);
                })
              )
            ),
            r.a.createElement(
              "div",
              null,
              r.a.createElement(
                "div",
                null,
                r.a.createElement(
                  "form",
                  { className: "form--search" },
                  r.a.createElement("input", {
                    placeholder: "Search your files",
                    type: "text",
                    className: "input--search",
                  }),
                  r.a.createElement(
                    "button",
                    { type: "submit", className: "button--search" },
                    r.a.createElement(v.a, {
                      icon: b.k,
                      size: "sm",
                      color: "#7d7d7d",
                    })
                  )
                )
              )
            )
          );
        },
        O = function (e) {
          var a = e.showFileExplorer,
            t = Object(p.a)(),
            l = Object(n.useState)([]),
            c = Object(o.a)(l, 2),
            i = c[0],
            s = c[1],
            d = Object(n.useState)([]),
            E = Object(o.a)(d, 2),
            g = E[0],
            w = E[1],
            O = (function () {
              var e = Object(m.a)(
                u.a.mark(function e() {
                  var a;
                  return u.a.wrap(function (e) {
                    for (;;)
                      switch ((e.prev = e.next)) {
                        case 0:
                          return (
                            (e.next = 2), h.ref(t.location.pathname).listAll()
                          );
                        case 2:
                          (a = e.sent), s(a.items), w(a.prefixes);
                        case 5:
                        case "end":
                          return e.stop();
                      }
                  }, e);
                })
              );
              return function () {
                return e.apply(this, arguments);
              };
            })();
          Object(n.useEffect)(
            function () {
              O();
            },
            [t.location.pathname]
          );
          return r.a.createElement(
            "div",
            { className: " file-explorer" },
            r.a.createElement(k, {
              showFileExplorer: a,
              title: "Firebase File Manager by Doruk Karaboncuk",
            }),
            r.a.createElement(j, { history: t }),
            r.a.createElement(x, null),
            r.a.createElement(
              "div",
              { className: "file-explorer--body" },
              r.a.createElement(
                "div",
                { className: "file-explorer--sidebar" },
                r.a.createElement(
                  "span",
                  { className: "sidebar--title" },
                  "Favourite(s)"
                )
              ),
              r.a.createElement(
                "div",
                { className: "file-explorer--main" },
                r.a.createElement(
                  "ul",
                  { className: "list--file" },
                  r.a.createElement(
                    "li",
                    null,
                    r.a.createElement(
                      "span",
                      { className: "button--sort" },
                      "Name"
                    ),
                    r.a.createElement(
                      "span",
                      { className: "button--sort" },
                      "Created"
                    ),
                    r.a.createElement(
                      "span",
                      { className: "button--sort" },
                      "Type"
                    ),
                    r.a.createElement(
                      "span",
                      { className: "button--sort" },
                      "Size"
                    ),
                    r.a.createElement(
                      "span",
                      { className: "button--sort" },
                      "Actions"
                    )
                  ),
                  (function (e) {
                    return 0 === e.length
                      ? null
                      : e.map(function (e) {
                          return r.a.createElement(
                            "li",
                            { key: e.name },
                            r.a.createElement(
                              "span",
                              null,
                              r.a.createElement(
                                f.a,
                                { to: "/".concat(e.name) },
                                r.a.createElement(v.a, {
                                  icon: b.e,
                                  color: "gold",
                                }),
                                " ",
                                e.name
                              )
                            ),
                            r.a.createElement("span", null),
                            r.a.createElement("span", null, "Folder"),
                            r.a.createElement("span", null),
                            r.a.createElement("span", null)
                          );
                        });
                  })(g),
                  (function (e) {
                    return 0 === e.length
                      ? r.a.createElement(
                          "li",
                          null,
                          r.a.createElement(
                            "span",
                            null,
                            "There is no file(s) in this folder."
                          ),
                          r.a.createElement("span", null),
                          r.a.createElement("span", null),
                          r.a.createElement("span", null),
                          r.a.createElement("span", null)
                        )
                      : e.map(function (e) {
                          return r.a.createElement(N, {
                            file: e,
                            key: e.name,
                            getFiles: O,
                          });
                        });
                  })(i)
                )
              )
            ),
            r.a.createElement(
              "div",
              { className: "file-explorer--footer" },
              g.length,
              " folder(s) and ",
              i.length,
              " file(s)"
            )
          );
        },
        y = t(32),
        F = (function () {
          var e = Object(m.a)(
            u.a.mark(function e(a) {
              var t, n;
              return u.a.wrap(function (e) {
                for (;;)
                  switch ((e.prev = e.next)) {
                    case 0:
                      return (
                        (t = ""
                          .concat(new Date().getTime(), "-")
                          .concat(a.name, ".jpg")),
                        (n = new Promise(function (e, n) {
                          if (!a) return n({ status: "File not found" });
                          h.ref("/")
                            .child("".concat(t))
                            .put(a)
                            .on(
                              "state_changed",
                              function (e) {
                                var t =
                                  (e.bytesTransferred / e.totalBytes) * 100;
                                switch ((console.log(t), e.state)) {
                                  case "paused":
                                    console.log("Upload is paused");
                                    break;
                                  case "running":
                                    console.log(
                                      "Upload is running for ".concat(a.name)
                                    );
                                    break;
                                  default:
                                    console.log("Default mod");
                                }
                              },
                              function (e) {
                                n({
                                  status: "error",
                                  errorMessage: "File not uploaded",
                                });
                              },
                              function () {
                                e({
                                  status: "success",
                                  fileName: t,
                                  originalName: a.name,
                                });
                              }
                            );
                        })),
                        e.abrupt("return", n)
                      );
                    case 3:
                    case "end":
                      return e.stop();
                  }
              }, e);
            })
          );
          return function (a) {
            return e.apply(this, arguments);
          };
        })(),
        D = function (e) {
          var a = e.index,
            t = e.file,
            n = e.deleteFile;
          return r.a.createElement(
            "div",
            { className: "list--uploadFiles", id: "file-".concat(a) },
            r.a.createElement(
              "span",
              { className: "uploadFiles--title" },
              t.name
            ),
            r.a.createElement(
              "span",
              { className: "uploadFiles--actions" },
              r.a.createElement(v.a, {
                icon: b.l,
                color: "red",
                onClick: function () {
                  return n(t.name);
                },
              })
            )
          );
        },
        S = function (e) {
          var a = e.showFileUpload,
            t = Object(n.useState)([]),
            l = Object(o.a)(t, 2),
            c = l[0],
            i = l[1],
            s = Object(n.useState)(""),
            p = Object(o.a)(s, 2),
            f = p[0],
            d = p[1],
            E = function (e) {
              var a = c.filter(function (a) {
                return e !== a.name;
              });
              i(a);
            };
          Object(n.useEffect)(
            function () {
              console.log("getting files");
            },
            [c]
          );
          var h = Object(n.useCallback)(function (e) {
              i(e);
            }, []),
            g = Object(y.a)({ onDrop: h }),
            w = g.getRootProps,
            N = g.getInputProps,
            k = g.isDragActive,
            x = (function () {
              var e = Object(m.a)(
                u.a.mark(function e() {
                  return u.a.wrap(function (e) {
                    for (;;)
                      switch ((e.prev = e.next)) {
                        case 0:
                          return (
                            (e.next = 2),
                            Promise.all(
                              c.map(
                                (function () {
                                  var e = Object(m.a)(
                                    u.a.mark(function e(a) {
                                      return u.a.wrap(
                                        function (e) {
                                          for (;;)
                                            switch ((e.prev = e.next)) {
                                              case 0:
                                                return (
                                                  (e.prev = 0),
                                                  (e.next = 3),
                                                  F(a)
                                                );
                                              case 3:
                                                e.sent.status, (e.next = 10);
                                                break;
                                              case 7:
                                                (e.prev = 7),
                                                  (e.t0 = e.catch(0)),
                                                  d(!0);
                                              case 10:
                                              case "end":
                                                return e.stop();
                                            }
                                        },
                                        e,
                                        null,
                                        [[0, 7]]
                                      );
                                    })
                                  );
                                  return function (a) {
                                    return e.apply(this, arguments);
                                  };
                                })()
                              )
                            )
                          );
                        case 2:
                          i([]);
                        case 3:
                        case "end":
                          return e.stop();
                      }
                  }, e);
                })
              );
              return function () {
                return e.apply(this, arguments);
              };
            })();
          return r.a.createElement(
            "div",
            { className: "file-upload" },
            r.a.createElement(
              "div",
              { className: "file-upload--header" },
              r.a.createElement(
                "span",
                { className: "file-upload--title" },
                "Upload Files"
              ),
              r.a.createElement(
                "span",
                { className: "file-upload--close" },
                r.a.createElement(v.a, { icon: b.l, color: "#666", onClick: a })
              )
            ),
            r.a.createElement(
              "div",
              w(),
              r.a.createElement("input", N()),
              k
                ? r.a.createElement(
                    "p",
                    { className: "dropzone__active" },
                    "Drop the files here ..."
                  )
                : r.a.createElement(
                    "p",
                    { className: "dropzone" },
                    "Drag 'n' drop some files here or click to select file(s)"
                  )
            ),
            (function (e) {
              return 0 === e.length
                ? []
                : e.map(function (e) {
                    return r.a.createElement(D, {
                      key: e.name,
                      file: e,
                      deleteFile: E,
                    });
                  });
            })(c),
            c.length > 0 &&
              r.a.createElement(
                "button",
                { className: "button", onClick: x },
                "Upload File(s)"
              ),
            f &&
              r.a.createElement(
                "span",
                { style: { fontSize: "12px", color: "red" } },
                "Uploads are disabled for demo session"
              )
          );
        },
        M = t(31),
        C = function () {
          var e = Object(n.useState)(new Date()),
            a = Object(o.a)(e, 2),
            t = a[0],
            l = a[1];
          Object(n.useEffect)(function () {
            var e = setInterval(function () {
              return c();
            }, 1e3);
            return function () {
              clearInterval(e);
            };
          });
          var c = function () {
            l(new Date());
          };
          return r.a.createElement("div", null, w()(t).format("HH:mm"));
        },
        z = function (e) {
          var a = e.showFileExplorer,
            t = e.showFileUpload;
          return r.a.createElement(
            "div",
            { className: "footer-container" },
            r.a.createElement(
              "div",
              { className: "footer-container--icons" },
              r.a.createElement(
                "span",
                { className: "taskbar-icon" },
                r.a.createElement(v.a, {
                  size: "lg",
                  icon: M.a,
                  color: "white",
                })
              ),
              r.a.createElement(
                "span",
                { className: "taskbar-icon", onClick: a },
                r.a.createElement(v.a, {
                  size: "lg",
                  icon: b.e,
                  color: "white",
                })
              ),
              r.a.createElement(
                "span",
                { className: "taskbar-icon" },
                r.a.createElement(v.a, {
                  size: "lg",
                  icon: b.c,
                  color: "white",
                })
              ),
              r.a.createElement(
                "span",
                { className: "taskbar-icon", onClick: t },
                r.a.createElement(v.a, {
                  size: "lg",
                  icon: b.d,
                  color: "white",
                })
              )
            ),
            r.a.createElement(
              "div",
              { className: "footer-container--meta" },
              r.a.createElement(
                "div",
                { className: "date-time-container" },
                r.a.createElement(
                  "span",
                  { className: "date-time-container--time" },
                  r.a.createElement(C, null),
                  " "
                ),
                r.a.createElement(
                  "span",
                  { className: "date-time-container--date" },
                  w()().format("DD.MM.YYYY")
                )
              ),
              r.a.createElement(
                "div",
                { className: "notifications-container" },
                r.a.createElement(v.a, { icon: b.a, color: "white" }),
                r.a.createElement(
                  "span",
                  { className: "notifications--label" },
                  "5"
                )
              )
            )
          );
        };
      t(53), t(54);
      var U = function () {
        var e = Object(p.a)();
        return r.a.createElement(
          i.b,
          { history: e },
          r.a.createElement(
            i.c,
            null,
            r.a.createElement(i.a, {
              component: function () {
                var e = Object(n.useState)(!0),
                  a = Object(o.a)(e, 2),
                  t = a[0],
                  l = a[1],
                  c = Object(n.useState)(!1),
                  i = Object(o.a)(c, 2),
                  s = i[0],
                  u = i[1],
                  m = function () {
                    l(!t);
                  },
                  p = function () {
                    u(!s);
                  };
                return r.a.createElement(
                  "div",
                  { className: "background" },
                  t && r.a.createElement(O, { showFileExplorer: m }),
                  s && r.a.createElement(S, { showFileUpload: p }),
                  r.a.createElement(z, {
                    showFileExplorer: m,
                    showFileUpload: p,
                  })
                );
              },
            })
          )
        );
      };
      Boolean(
        "localhost" === window.location.hostname ||
          "[::1]" === window.location.hostname ||
          window.location.hostname.match(
            /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
          )
      );
      c.a.render(r.a.createElement(U, null), document.getElementById("root")),
        "serviceWorker" in navigator &&
          navigator.serviceWorker.ready.then(function (e) {
            e.unregister();
          });
    },
  },
  [[33, 1, 2]],
]);
//# sourceMappingURL=main.8f3d3f3b.chunk.js.map
